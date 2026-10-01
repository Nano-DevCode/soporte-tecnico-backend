import { Module } from '@nestjs/common';
import { DigitalSignatureService } from './service/digital-signature.service';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerService } from './services/app-logger.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { RequestIdMiddleware } from './middlewares/request-id.middleware';

import { RedisService } from './services/redis.service';
import { AppCacheService } from './services/app-cache.service';

@Module({
  imports: [ConfigModule],
  providers: [
    DigitalSignatureService,
    AppLoggerService,
    LoggingInterceptor,
    RequestIdMiddleware,
    RedisService,
    AppCacheService,
  ],
  exports: [
    DigitalSignatureService,
    AppLoggerService,
    LoggingInterceptor,
    RequestIdMiddleware,
    RedisService,
    AppCacheService,
  ],
})
export class CommonModule {}
