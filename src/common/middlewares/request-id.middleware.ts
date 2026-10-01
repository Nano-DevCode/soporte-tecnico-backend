import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  requestContextStorage,
  RequestContextStore,
} from '../context/request-context';

export interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const rawHeader = req.headers['x-request-id'];
    const requestId =
      typeof rawHeader === 'string' && rawHeader.trim().length > 0
        ? rawHeader.trim()
        : uuidv4();

    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    const store: RequestContextStore = {
      requestId,
      ip: req.ip || req.socket?.remoteAddress,
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.headers['user-agent'] as string,
    };


    requestContextStorage.run(store, () => {
      next();
    });
  }
}
