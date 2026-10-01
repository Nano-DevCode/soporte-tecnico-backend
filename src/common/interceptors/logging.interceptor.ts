import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RequestContext } from '../context/request-context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request & { user?: { id?: string } }>();
    const res = httpContext.getResponse<Response>();

    const { method, originalUrl, url } = req;
    const path = originalUrl || url;
    const startTime = Date.now();
    const requestId = RequestContext.getRequestId() || 'no-req-id';

    // Si el usuario ya está autenticado en la petición, lo sincronizamos al contexto
    if (req.user?.id) {
      RequestContext.setUserId(req.user.id);
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        const userId = RequestContext.getUserId() || req.user?.id || 'anon';

        this.logger.log(
          `${method} ${path} ${statusCode} +${duration}ms [user: ${userId}] [reqId: ${requestId}]`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;
        const userId = RequestContext.getUserId() || req.user?.id || 'anon';
        const message = error.message || 'Internal server error';

        this.logger.error(
          `${method} ${path} ${statusCode} +${duration}ms - Error: ${message} [user: ${userId}] [reqId: ${requestId}]`,
          error.stack,
        );

        return throwError(() => error);
      }),
    );
  }
}
