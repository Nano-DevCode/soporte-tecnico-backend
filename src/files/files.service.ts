import { v4 as uuid } from 'uuid';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { extname, parse } from 'path';
import { Readable } from 'stream';
import sharp from 'sharp';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllowedBucket } from './interfaces/AllowedBucket.interfaces';
import * as ExcelJS from 'exceljs';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

type FileTypeResult = { ext: string; mime: string } | undefined;
type FileTypeDetector = (buffer: Buffer) => Promise<FileTypeResult>;

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.configService.getOrThrow<string>('MINIO_ENDPOINT'),
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('MINIO_ROOT_USER'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'MINIO_ROOT_PASSWORD',
        ),
      },
      forcePathStyle: true,
    });
  }

  // Tamaño maximo del archivo 5 MB
  private readonly maxFileSize = 5 * 1024 * 1024;
  private readonly allowedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.pdf',
    '.xlsx',
    '.xls',
  ];
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];

  async uploadFile(
    file: MulterFile,
    bucketName: AllowedBucket,
    customName?: string,
  ) {
    const typeDetector = await this.getFileTypeDetector();

    await this.validateFile(file, typeDetector);

    // --- LÓGICA DE REEMPLAZO ---
    // Si envías un customName (UUID), borramos cualquier versión vieja primero
    if (customName) {
      await this.deleteOldVersions(bucketName, customName);
    }

    let fileBuffer = file.buffer;
    let fileExtension = extname(file.originalname).toLowerCase();
    let finalMimeType = file.mimetype;

    // Solo sanitizamos si es imagen y forzamos a webp
    if (this.isImage(file.mimetype)) {
      fileBuffer = await this.sanitizeImage(file.buffer);
      fileExtension = '.webp';
      finalMimeType = 'image/webp';
    }

    const fileName = this.generateFileName(fileExtension, customName);
    const detectedType = await typeDetector(fileBuffer);

    const url = await this.uploadToS3(
      bucketName,
      fileName,
      fileBuffer,
      this.isImage(file.mimetype)
        ? finalMimeType
        : detectedType?.mime || file.mimetype,
      file.originalname,
    );

    return { fileName, url, bucket: bucketName };
  }

  async getFileStream(
    bucketName: AllowedBucket,
    fileName: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    this.validateFileName(fileName);
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });
      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new NotFoundException('Archivo vacío');
      }

      return {
        stream: response.Body as Readable,
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(
        `Error en bucket ${bucketName} archivo ${fileName}: ${error}`,
      );
      throw new NotFoundException(
        `El archivo ${fileName} no existe en ${bucketName}`,
      );
    }
  }

  private async uploadToS3(
    bucketName: string,
    fileName: string,
    body: Buffer,
    contentType: string,
    originalName: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: body,
      ContentType: contentType,
      Metadata: {
        'original-name': Buffer.from(originalName).toString('base64'),
      },
    });

    try {
      await this.s3Client.send(command);
      return `/files/${bucketName}/${fileName}`;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(`Error al subir a ${bucketName}`);
    }
  }

  private async validateFile(
    file: MulterFile,
    fileTypeDetector: FileTypeDetector,
  ): Promise<void> {
    if (file.size > this.maxFileSize)
      throw new BadRequestException('El archivo debe de ser menor a 5MB');
    const detectedType = await fileTypeDetector(file.buffer);
    if (!detectedType || !this.allowedMimeTypes.includes(detectedType.mime))
      throw new BadRequestException('Tipo incorrecto');
    if (!this.isImage(detectedType.mime))
      this.scanForMalwareSignatures(file.buffer);
  }

  private isImage(mime: string) {
    return mime.startsWith('image/');
  }

  private async sanitizeImage(buffer: Buffer): Promise<Buffer> {
    try {
      return sharp(buffer).rotate().webp({ quality: 80 }).toBuffer();
    } catch {
      throw new BadRequestException('Imagen corrupta');
    }
  }

  private generateFileName(ext: string, customName?: string) {
    if (customName) {
      return customName.toLowerCase().endsWith(ext)
        ? customName
        : `${customName}${ext}`;
    }
    return `${uuid()}${ext}`;
  }

  private scanForMalwareSignatures(buffer: Buffer): void {
    // 1. Convertir a string solo el inicio del archivo (máx 10KB) para buscar firmas de texto
    const bufferString = buffer.toString(
      'utf8',
      0,
      Math.min(buffer.length, 10000),
    );

    // 2. Firmas de texto sospechosas (Scripts, PHP, JS en PDFs)
    const malwareSignatures = [
      // JavaScript malicioso en PDFs
      '/JavaScript',
      '/JS',
      '/OpenAction',
      '/AA', // Auto-action
      // Scripts peligrosos
      '<script>',
      '<script ',
      'javascript:',
      'vbscript:',
      // PHP/ASP embebido
      '<?php',
      '<%@',
      '<%eval',
      // Comandos del sistema
      'cmd.exe /c',
      'powershell.exe',
      '/bin/bash -c',
      'sh -c',
      // Funciones peligrosas de PHP/Shell
      'shell_exec(',
      'system(',
      'passthru(',
      'exec(',
    ];

    for (const signature of malwareSignatures) {
      if (bufferString.includes(signature)) {
        throw new BadRequestException(
          'Archivo rechazado: contiene contenido potencialmente malicioso',
        );
      }
    }

    // 3. Verificar Magic Numbers (Cabeceras) de ejecutables binarios
    const executableSignatures = [
      { signature: Buffer.from([0x4d, 0x5a]), name: 'PE' }, // Windows .exe
      { signature: Buffer.from([0x7f, 0x45, 0x4c, 0x46]), name: 'ELF' }, // Linux
      { signature: Buffer.from([0xcf, 0xfa, 0xed, 0xfe]), name: 'Mach-O' }, // macOS
    ];

    for (const { signature, name } of executableSignatures) {
      if (buffer.subarray(0, signature.length).equals(signature)) {
        throw new BadRequestException(
          `Archivo rechazado: es un ejecutable ${name}`,
        );
      }
    }

    // 4. Verificar scripts con Shebang (#!)
    // Solo si empieza exactamente con los bytes 0x23 (#) y 0x21 (!)
    if (buffer.length > 2 && buffer[0] === 0x23 && buffer[1] === 0x21) {
      const firstLine = buffer
        .toString('utf8', 0, Math.min(buffer.length, 100))
        .split('\n')[0];
      const dangerousInterpreters = [
        '/bin/sh',
        '/bin/bash',
        'python',
        'perl',
        'ruby',
        'node',
      ];

      if (dangerousInterpreters.some((interp) => firstLine.includes(interp))) {
        throw new BadRequestException(
          'Archivo rechazado: contiene script ejecutable',
        );
      }
    }
  }
  private validateFileName(name: string) {
    if (name.includes('..')) throw new BadRequestException('Nombre inválido');
  }
  private async deleteOldVersions(bucketName: string, customName: string) {
    try {
      // Extraemos el nombre base (el UUID) sin la extensión
      const baseName = parse(customName).name;

      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: baseName,
      });

      const { Contents } = await this.s3Client.send(listCommand);

      if (Contents && Contents.length > 0) {
        for (const item of Contents) {
          if (item.Key && parse(item.Key).name === baseName) {
            await this.s3Client.send(
              new DeleteObjectCommand({
                Bucket: bucketName,
                Key: item.Key,
              }),
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error al limpiar versiones antiguas: ${error}`);
    }
  }

  async saveGeneratedExcel(
    workbook: ExcelJS.Workbook,
    bucketName: AllowedBucket,
    customName?: string,
  ) {
    // 1. Convertimos el Workbook de ExcelJS a un Buffer
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const fileExtension = '.xlsx';
    const mimeType =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    // 2. Lógica de reemplazo (igual que en uploadFile)
    if (customName) {
      await this.deleteOldVersions(bucketName, customName);
    }

    // 3. Generar el nombre final
    const fileName = this.generateFileName(fileExtension, customName);

    // 4. Subir a MinIO usando tu método privado
    const url = await this.uploadToS3(
      bucketName,
      fileName,
      fileBuffer,
      mimeType,
      customName ? `${customName}${fileExtension}` : fileName,
    );

    return { fileName, url, bucket: bucketName };
  }

  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });
      await this.s3Client.send(command);
      this.logger.log(
        `Archivo ${fileName} eliminado de ${bucketName} (Rollback)`,
      );
    } catch (error) {
      // Solo logueamos el error, no lanzamos excepción para no interrumpir
      // la cascada de errores original de la base de datos.
      this.logger.error(
        `Error al intentar eliminar ${fileName} en rollback: ${error}`,
      );
    }
  }
  private async getFileTypeDetector(): Promise<FileTypeDetector> {
    const { fileTypeFromBuffer } = await import('file-type');
    return fileTypeFromBuffer;
  }
}
