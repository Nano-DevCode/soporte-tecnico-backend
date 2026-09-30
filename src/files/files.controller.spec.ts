import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Readable } from 'stream';
import type { Response } from 'express';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { MulterFile } from './interfaces/multer-file.interface';

describe('FilesController', () => {
  let controller: FilesController;
  let service: jest.Mocked<FilesService>;

  // Mock básico de un archivo recibido por Multer
  const mockFile = {
    originalname: 'test-image.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-data'),
    size: 1024,
  } as MulterFile;

  // Mock del Response de Express para probar las cabeceras y el pipe
  const mockResponse = {
    set: jest.fn(),
  } as unknown as Response;

  // Mock de un Stream de lectura para simular el archivo descargado
  const mockStream = new Readable({
    read() {}, // Implementación vacía obligatoria para Readable
  });
  mockStream.pipe = jest.fn(); // Mockeamos el método pipe

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: {
            uploadFile: jest.fn(),
            getFileStream: jest.fn(),
          },
        },
        // 👇 Mocks necesarios para el decorador @Auth()
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get(FilesService);
    Object.defineProperty(controller, 'allowedBuckets', {
      value: ['tools-images', 'excels'],
      configurable: true,
      writable: true,
    });

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /* ========================================================================
     UPLOAD FILE
  ======================================================================== */
  describe('uploadFile', () => {
    it('debe subir un archivo exitosamente y retornar el resultado con mensaje', async () => {
      const expectedResult: Awaited<ReturnType<FilesService['uploadFile']>> = {
        fileName: 'uuid.webp',
        url: '/files/tools-images/uuid.webp',
        bucket: 'tools-images',
      };

      service.uploadFile.mockResolvedValue(expectedResult);

      const result = await controller.uploadFile('tools-images', mockFile);

      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, 'tools-images');
      expect(result).toEqual({
        message: 'Archivo subido exitosamente',
        ...expectedResult,
      });
    });

    it('debe lanzar BadRequestException si el bucket no es válido', async () => {
      await expect(
        controller.uploadFile('bucket-invalido', mockFile),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.uploadFile('bucket-invalido', mockFile),
      ).rejects.toThrow('El bucket "bucket-invalido" no es válido.');
    });

    it('debe lanzar BadRequestException si no se envía ningún archivo', async () => {
      await expect(
        controller.uploadFile(
          'tools-images',
          undefined as unknown as MulterFile,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.uploadFile(
          'tools-images',
          undefined as unknown as MulterFile,
        ),
      ).rejects.toThrow('No se ha enviado ningún archivo');
    });
  });

  /* ========================================================================
     GET FILE
  ======================================================================== */
  describe('getFile', () => {
    it('debe retornar un archivo general con Content-Disposition: inline (Visualizar en navegador)', async () => {
      service.getFileStream.mockResolvedValue({
        stream: mockStream,
        contentType: 'image/webp',
      });

      await controller.getFile('tools-images', 'imagen.webp', mockResponse);

      // 1. Verifica que haya buscado el archivo
      expect(service.getFileStream).toHaveBeenCalledWith(
        'tools-images',
        'imagen.webp',
      );

      // 2. Verifica que las cabeceras se configuraron como 'inline'
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'image/webp',
        'Content-Disposition': 'inline; filename="imagen.webp"',
      });

      // 3. Verifica que el stream del archivo se conectó (pipe) al response de Express
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('debe retornar un archivo excel con Content-Disposition: attachment (Fuerza la descarga)', async () => {
      service.getFileStream.mockResolvedValue({
        stream: mockStream,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Usamos el bucket 'excels' que dispara la lógica de descarga
      await controller.getFile('excels', 'reporte.xlsx', mockResponse);

      // Verifica que las cabeceras se configuraron como 'attachment'
      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Disposition': 'attachment; filename="reporte.xlsx"',
        }),
      );
    });

    it('debe lanzar BadRequestException si el bucket no es válido al obtener archivo', async () => {
      await expect(
        controller.getFile('bucket-invalido', 'file.txt', mockResponse),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
