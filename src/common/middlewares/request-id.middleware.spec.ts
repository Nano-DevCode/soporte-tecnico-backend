import { RequestIdMiddleware, RequestWithId } from './request-id.middleware';
import type { Response, NextFunction } from 'express';
import { RequestContext } from '../context/request-context';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('debería estar definido', () => {
    expect(middleware).toBeDefined();
  });

  it('debería generar un nuevo UUID si no viene X-Request-ID en los headers', (done) => {
    const req = {
      headers: {},
      ip: '127.0.0.1',
      method: 'GET',
      originalUrl: '/api/tickets',
    } as unknown as RequestWithId;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next: NextFunction = jest.fn(() => {
      expect(req.requestId).toBeDefined();
      expect(typeof req.requestId).toBe('string');
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.requestId);
      expect(RequestContext.getRequestId()).toBe(req.requestId);
      done();
    });

    middleware.use(req, res, next);
  });

  it('debería reutilizar el X-Request-ID existente enviado por el cliente', (done) => {
    const existingId = 'custom-correlation-id-12345';
    const req = {
      headers: {
        'x-request-id': existingId,
      },
      ip: '10.0.0.1',
      method: 'POST',
      url: '/api/auth/login',
    } as unknown as RequestWithId;

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next: NextFunction = jest.fn(() => {
      expect(req.requestId).toBe(existingId);
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
      expect(RequestContext.getRequestId()).toBe(existingId);
      done();
    });

    middleware.use(req, res, next);
  });
});
