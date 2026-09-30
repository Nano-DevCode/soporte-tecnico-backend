// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { RedisHealthIndicator } from './indicators/redis.health/redis.health';
import { MinioHealthIndicator } from './indicators/minio.health/minio.health';
import { GmailHealthIndicator } from './indicators/gmail.health/gmail.health';
import { TelegramHealthIndicator } from './indicators/telegram.health/telegram.health';
import { BullHealthIndicator } from './indicators/bull.health/bull.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private minio: MinioHealthIndicator,
    private gmail: GmailHealthIndicator,
    private telegram: TelegramHealthIndicator,
    private bull: BullHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Verificar el estado de todos los servicios' })
  @ApiOkResponse({ description: 'Todos los servicios están UP.' })
  @ApiServiceUnavailableResponse({
    description: 'Uno o más servicios están DOWN.',
  })
  check() {
    return this.health.check([
      // PostgreSQL
      () => this.db.pingCheck('postgresql', { timeout: 3000 }),

      // Redis
      () => this.redis.isHealthy('redis'),

      // MinIO / S3
      () => this.minio.isHealthy('minio'),

      // Gmail SMTP
      () => this.gmail.isHealthy('gmail-smtp'),

      // Telegram Bot
      () => this.telegram.isHealthy('telegram-bot'),

      // Bull Queues
      () => this.bull.isHealthy('bull:email-queue', 'email-queue'),
      () => this.bull.isHealthy('bull:telegram-queue', 'telegram-queue'),
    ]);
  }
}
