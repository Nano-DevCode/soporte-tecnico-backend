import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.health/redis.health';
import { MinioHealthIndicator } from './indicators/minio.health/minio.health';
import { GmailHealthIndicator } from './indicators/gmail.health/gmail.health';
import { TelegramHealthIndicator } from './indicators/telegram.health/telegram.health';
import { BullHealthIndicator } from './indicators/bull.health/bull.health';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    RedisHealthIndicator,
    MinioHealthIndicator,
    GmailHealthIndicator,
    TelegramHealthIndicator,
    BullHealthIndicator,
  ],
  imports: [
    TerminusModule,
    HttpModule,
    BullModule.registerQueue(
      { name: 'email-queue' },
      { name: 'telegram-queue' },
    ),
  ],
})
export class HealthModule {}
