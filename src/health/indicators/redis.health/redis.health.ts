// indicators/redis.health.ts

import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const client = new Redis({
      host: this.configService.get<string>('DB_HOST_REDIS') || '127.0.0.1',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      password: this.configService.get<string>('REDIS_PASSWORD') || '',
      connectTimeout: 3000,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
    });

    try {
      await client.connect();
      await client.ping();
      return this.getStatus(key, true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido de Redis';

      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { message: errorMessage }),
      );
    } finally {
      client.disconnect();
    }
  }
}
