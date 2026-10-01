import { LoggingInterceptor } from './logging.interceptor';
import {
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { of, throwError, lastValueFrom } from 'rxjs';
import {
  RequestContext,
  requestContextStorage,
} from '../context/request-context';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debería estar definido', () => {
    expect(interceptor).toBeDefined();
  });

  it('debería omitir la intercepción si el contexto no es http', async () => {
    const context = {
      getType: jest.fn().mockReturnValue('rpc'),
    } as unknown as ExecutionContext;

    const next = {
      handle: jest.fn().mockReturnValue(of({ ok: true })),
    } as unknown as CallHandler;

    const result = await lastValueFrom(interceptor.intercept(context, next));
    expect(result).toEqual({ ok: true });
    expect(next.handle).toHaveBeenCalled();
  });

  it('debería registrar una petición exitosa con método, ruta, código y duración', async () => {
    const mockRequest = {
      method: 'GET',
      originalUrl: '/api/tickets',
      user: { id: 'user-uuid-123' },
    };
    const mockResponse = {
      statusCode: 200,
    };

    const context = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;

    const next = {
      handle: jest.fn().mockReturnValue(of({ data: 'tickets' })),
    } as unknown as CallHandler;

    await requestContextStorage.run(
      { requestId: 'test-req-id' },
      async () => {
        const result = await lastValueFrom(
          interceptor.intercept(context, next),
        );
        expect(result).toEqual({ data: 'tickets' });
        expect(RequestContext.getUserId()).toBe('user-uuid-123');
      },
    );
  });

  it('debería capturar errores, registrar el código de error y propagar la excepción', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/tickets',
    };
    const mockResponse = {
      statusCode: 500,
    };

    const context = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;

    const customError = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    const next = {
      handle: jest.fn().mockReturnValue(throwError(() => customError)),
    } as unknown as CallHandler;

    await expect(
      requestContextStorage.run({ requestId: 'test-req-id' }, () =>
        lastValueFrom(interceptor.intercept(context, next)),
      ),
    ).rejects.toThrow(customError);
  });
});
