import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import * as ExcelJS from 'exceljs';

import { FilesService, MulterFile } from './files.service';

// 1. Mock de Sharp
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    rotate: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest
      .fn()
      .mockResolvedValue(Buffer.from('imagen-sanitizada-webp')),
  }));
});

// 2. Mock GLOBAL de AWS SDK v3 (Soluciona el error de S3 NotFound)
const mockS3Send = jest.fn();
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockS3Send,
    })),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn(),
    DeleteObjectCommand: jest.fn(),
  };
});

describe('FilesService', () => {
  let service: FilesService;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        MINIO_ENDPOINT: 'http://localhost:9000',
        MINIO_ROOT_USER: 'admin',
        MINIO_ROOT_PASSWORD: 'password',
      };
      return config[key];
    }),
  };

  const mockFile: MulterFile = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    destination: '',
    filename: 'test.jpg',
    path: '',
    buffer: Buffer.from('fake-image-data'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);

    // Silenciamos los logs nativos
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});

    // 3. Mockeamos el método privado que envuelve la librería ESM conflictiva
    jest
      .spyOn(service as any, 'getFileTypeDetector')
      .mockResolvedValue(
        jest.fn().mockResolvedValue({ ext: 'jpg', mime: 'image/jpeg' }),
      );

    jest.clearAllMocks();
    mockS3Send.mockReset(); // Limpiamos el mock de S3 entre pruebas
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ========================================================================
     UPLOAD FILE
  ======================================================================== */
  describe('uploadFile', () => {
    it('debe procesar y subir una imagen correctamente (usa Sharp y la convierte a webp)', async () => {
      mockS3Send.mockResolvedValue({});

      const result = await service.uploadFile(mockFile, 'tools-images');

      expect(result).toHaveProperty('fileName');
      expect(result.fileName).toMatch(/\.webp$/);
      expect(result).toHaveProperty('url');
      expect(mockS3Send).toHaveBeenCalled();
    });

    it('debe subir un documento válido (PDF) sin usar Sharp ni forzar webp', async () => {
      // Cambiamos el mock del detector dinámico solo para esta prueba
      jest
        .spyOn(service as any, 'getFileTypeDetector')
        .mockResolvedValue(
          jest.fn().mockResolvedValue({ ext: 'pdf', mime: 'application/pdf' }),
        );

      const pdfFile: MulterFile = {
        ...mockFile,
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
      };

      mockS3Send.mockResolvedValue({});

      const result = await service.uploadFile(pdfFile, 'tools-images');

      expect(result.fileName).toMatch(/\.pdf$/);
      expect(mockS3Send).toHaveBeenCalled();
    });

    it('debe limpiar versiones antiguas si se provee un customName (ej. UUID del activo)', async () => {
      mockS3Send
        .mockResolvedValueOnce({
          Contents: [{ Key: '123e4567-e89b-12d3-a456-426614174000.jpg' }],
        })
        .mockResolvedValue({});

      const customName = '123e4567-e89b-12d3-a456-426614174000';
      await service.uploadFile(mockFile, 'tools-images', customName);

      expect(mockS3Send).toHaveBeenCalledTimes(3);
    });

    it('debe lanzar BadRequestException si el archivo excede 5MB', async () => {
      const bigFile = { ...mockFile, size: 6 * 1024 * 1024 }; // 6MB
      await expect(service.uploadFile(bigFile, 'tools-images')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si el tipo mime detectado no está permitido', async () => {
      jest.spyOn(service as any, 'getFileTypeDetector').mockResolvedValue(
        jest.fn().mockResolvedValue({
          ext: 'exe',
          mime: 'application/x-msdownload',
        }),
      );

      await expect(
        service.uploadFile(mockFile, 'tools-images'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /* ========================================================================
     GET FILE STREAM
  ======================================================================== */
  describe('getFileStream', () => {
    it('debe devolver un stream y contentType si el archivo existe', async () => {
      const mockStream = new Readable();
      mockS3Send.mockResolvedValueOnce({
        Body: mockStream,
        ContentType: 'image/webp',
      });

      const result = await service.getFileStream('tools-images', 'imagen.webp');

      expect(result.stream).toBe(mockStream);
      expect(result.contentType).toBe('image/webp');
    });

    it('debe lanzar BadRequestException si el nombre del archivo contiene ".." (Path Traversal)', async () => {
      await expect(
        service.getFileStream('tools-images', '../secret.txt'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si el archivo no existe o S3 falla', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('S3 Not Found'));

      await expect(
        service.getFileStream('tools-images', 'no-existe.webp'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /* ========================================================================
     SAVE GENERATED EXCEL
  ======================================================================== */
  describe('saveGeneratedExcel', () => {
    it('debe convertir el workbook a buffer y subirlo a S3', async () => {
      const mockWorkbook = {
        xlsx: {
          writeBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
        },
      } as unknown as ExcelJS.Workbook;

      mockS3Send.mockResolvedValue({});

      const result = await service.saveGeneratedExcel(
        mockWorkbook,
        'tools-images',
        'reporte-test',
      );

      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
      expect(result.fileName).toMatch(/reporte-test\.xlsx$/);
      expect(mockS3Send).toHaveBeenCalled();
    });
  });

  /* ========================================================================
     DELETE FILE
  ======================================================================== */
  describe('deleteFile', () => {
    it('debe ejecutar el comando de borrado correctamente', async () => {
      mockS3Send.mockResolvedValue({});
      await service.deleteFile('tools-images', 'archivo.webp');
      expect(mockS3Send).toHaveBeenCalled();
    });

    it('no debe lanzar excepción si S3 falla al borrar (para no romper el rollback)', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('Fallo al borrar'));

      await expect(
        service.deleteFile('tools-images', 'archivo.webp'),
      ).resolves.not.toThrow();
      expect(service['logger'].error).toHaveBeenCalled();
    });
  });

  /* ========================================================================
     MALWARE SCANNER (MÉTODOS PRIVADOS)
  ======================================================================== */
  describe('scanForMalwareSignatures (Validaciones de Seguridad)', () => {
    const scanMalware = (buffer: Buffer) =>
      service['scanForMalwareSignatures'](buffer);

    it('debe rechazar archivos que contengan firmas de texto maliciosas (ej. <script>)', () => {
      const maliciousBuffer = Buffer.from(
        'PDF normal... <script>alert(1)</script>',
      );
      expect(() => scanMalware(maliciousBuffer)).toThrow(BadRequestException);
    });

    it('debe rechazar archivos con Magic Numbers ejecutables (ej. Windows PE .exe)', () => {
      const peBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
      expect(() => scanMalware(peBuffer)).toThrow(
        'Archivo rechazado: es un ejecutable PE',
      );
    });

    it('debe rechazar scripts interpretados mediante Shebang (#!)', () => {
      const shebangBuffer = Buffer.from('#!/bin/bash\nrm -rf /');
      expect(() => scanMalware(shebangBuffer)).toThrow(
        'Archivo rechazado: contiene script ejecutable',
      );
    });

    it('debe aceptar un buffer limpio que no coincida con firmas de malware', () => {
      const cleanBuffer = Buffer.from(
        'Contenido de texto normal de un PDF seguro...',
      );
      expect(() => scanMalware(cleanBuffer)).not.toThrow();
    });
  });
});
