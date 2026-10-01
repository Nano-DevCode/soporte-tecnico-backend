import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { QueryFailedError } from 'typeorm';

interface PostgresError extends Error {
  code: string;
  detail?: string;
  column?: string;
  table?: string;
  constraint?: string;
  query?: string;
  parameters?: unknown[];
}

@Catch(QueryFailedError)
export class DbexceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('DBExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const dbError = exception as PostgresError;
    const code = dbError.code;

    let message: string;
    let statusCode: number;

    switch (code) {
      case '23505':
        statusCode = HttpStatus.CONFLICT;
        message =
          'El registro que intenta guardar ya existe en el sistema. Verifique los datos duplicados.';
        break;

      case '23503':
        statusCode = HttpStatus.CONFLICT;
        if (request.method === 'DELETE') {
          message =
            'No se puede eliminar el registro porque está siendo utilizado por otros módulos del sistema.';
        } else {
          message =
            'Uno de los datos de referencia enviados no existe. Verifique las relaciones.';
        }
        break;

      case '23502':
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Faltan datos obligatorios para procesar la solicitud.';
        break;

      default:
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message =
          'Error inesperado en el servidor, contacte al administrador del Centro de Cómputo.';
        break;
    }

    this.logger.error({
      code,
      path: request.url,
      method: request.method,
      dbMessage: dbError.message,
      dbDetail: dbError.detail,
      dbQuery: dbError.query,
      dbParameters: dbError.parameters,
    });

    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
