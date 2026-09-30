import {
  Injectable,
  HttpException,
  HttpStatus,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { catchError, tap, throwError, type Observable } from 'rxjs';
import type { Request } from 'express';

const idempotencyCache = new Set<string>();

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    const rawHeader = request.headers['x-idempotency-key'];

    const idempotencyKey: string | undefined = Array.isArray(rawHeader)
      ? rawHeader[0]
      : rawHeader;

    if (!idempotencyKey) {
      return next.handle();
    }

    if (idempotencyCache.has(idempotencyKey)) {
      throw new HttpException(
        'Petición duplicada detectada. Por favor, espera un momento.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    idempotencyCache.add(idempotencyKey);

    const timeout = setTimeout(() => {
      idempotencyCache.delete(idempotencyKey);
    }, 10000);

    return next.handle().pipe(
      tap(() => {
        clearTimeout(timeout);
        idempotencyCache.delete(idempotencyKey);
      }),
      catchError((error) => {
        clearTimeout(timeout);
        idempotencyCache.delete(idempotencyKey);
        return throwError(() =>
          error instanceof Error ? error : new Error(String(error)),
        );
      }),
    );
  }
}
