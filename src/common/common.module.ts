import { Module } from '@nestjs/common';
import { DigitalSignatureService } from './service/digital-signature.service';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerService } from './services/app-logger.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { RequestIdMiddleware } from './middlewares/request-id.middleware';

@Module({
  imports: [ConfigModule],
  providers: [
    DigitalSignatureService,
    AppLoggerService,
    LoggingInterceptor,
    RequestIdMiddleware,
  ],
  exports: [
    DigitalSignatureService,
    AppLoggerService,
    LoggingInterceptor,
    RequestIdMiddleware,
  ],
})
export class CommonModule {}
