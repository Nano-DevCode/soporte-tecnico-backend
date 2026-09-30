import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { type MulterFile } from './interfaces/multer-file.interface';
import {
  ALLOWED_BUCKETS_NAMES,
  type AllowedBucket,
} from './interfaces/AllowedBucket.interfaces';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Files')
@ApiCookieAuth() // Indicamos que todas las rutas protegidas aquí usan cookies
@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  // Lista de buckets permitidos (debe coincidir con el Service o importarse de allí)
  private readonly allowedBuckets = ALLOWED_BUCKETS_NAMES;

  constructor(private readonly filesService: FilesService) {}

  @Post(':bucket')
  @Auth(
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.tecnico,
  )
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir un archivo a un bucket específico en MinIO' })
  @ApiParam({
    name: 'bucket',
    enum: ALLOWED_BUCKETS_NAMES,
    description: 'Nombre del bucket de destino',
  })
  @ApiConsumes('multipart/form-data') // Habilita el formulario en Swagger
  @ApiBody({
    description: 'Archivo a cargar',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary', // Genera el botón "Seleccionar archivo" en Swagger
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'El archivo fue subido exitosamente.' })
  @ApiBadRequestResponse({
    description: 'Bucket inválido, archivo faltante o formato incorrecto.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. Solo coordinadores, jefecc o superAdmin pueden subir archivos.',
  })
  async uploadFile(
    @Param('bucket') bucket: string,
    @UploadedFile() file: MulterFile,
  ) {
    this.validateBucket(bucket);

    if (!file) {
      throw new BadRequestException('No se ha enviado ningún archivo');
    }

    // Llamamos al servicio pasando el bucket validado y el archivo
    const result = await this.filesService.uploadFile(
      file,
      bucket as AllowedBucket,
    );

    return {
      message: 'Archivo subido exitosamente',
      ...result,
    };
  }

  @Get(':bucket/:fileName')
  @Auth()
  @ApiOperation({ summary: 'Obtener o descargar un archivo específico' })
  @ApiParam({
    name: 'bucket',
    enum: ALLOWED_BUCKETS_NAMES,
    description: 'Nombre del bucket donde está el archivo',
  })
  @ApiParam({
    name: 'fileName',
    description: 'Nombre del archivo con extensión',
    type: 'string',
  })
  @ApiOkResponse({
    description:
      'Retorna el stream del archivo. Si es un excel, fuerza la descarga.',
  })
  @ApiBadRequestResponse({
    description: 'Bucket o nombre de archivo no válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado para ver este archivo.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes para este recurso.',
  })
  async getFile(
    @Param('bucket') bucket: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    this.validateBucket(bucket);

    const { stream, contentType } = await this.filesService.getFileStream(
      bucket as AllowedBucket,
      fileName,
    );

    const disposition = bucket === 'excels' ? 'attachment' : 'inline';

    // Configuramos los headers para que el navegador sepa qué hacer
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `${disposition}; filename="${fileName}"`,
    });

    // Conectamos el stream de MinIO directamente a la respuesta de Express
    stream.pipe(res);
  }

  // Valida si el string recibido en la URL corresponde a un bucket real.
  private validateBucket(bucket: string): void {
    if (!this.allowedBuckets.includes(bucket as AllowedBucket)) {
      throw new BadRequestException(`El bucket "${bucket}" no es válido.`);
    }
  }
}
