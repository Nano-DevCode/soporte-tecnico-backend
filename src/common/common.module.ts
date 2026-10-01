import { Module } from '@nestjs/common';
import { DigitalSignatureService } from './service/digital-signature.service';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerService } from './services/app-logger.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { RequestIdMiddleware } from './middlewares/request-id.middleware';

import { RedisService } from './services/redis.service';

@Module({
  imports: [ConfigModule],
  providers: [
    DigitalSignatureService,
    AppLoggerService,
    LoggingInterceptor,
    RequestIdMiddleware,
    RedisService,
  ],
  exports: [
    DigitalSignatureService,
    AppLoggerService,
    LoggingInterceptor,
    RequestIdMiddleware,
    RedisService,
  ],
})
export class CommonModule {}
