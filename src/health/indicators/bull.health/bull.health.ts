// indicators/bull.health.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bull';
import { type Queue } from 'bull';

@Injectable()
export class BullHealthIndicator extends HealthIndicator {
  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue,
    @InjectQueue('telegram-queue') private telegramQueue: Queue,
  ) {
    super();
  }

  async isHealthy(
    key: string,
    queueName: string,
  ): Promise<HealthIndicatorResult> {
    const queues: Record<string, Queue> = {
      'email-queue': this.emailQueue,
      'telegram-queue': this.telegramQueue,
    };

    const queue = queues[queueName];
    if (!queue) {
      throw new HealthCheckError(
        `Queue ${queueName} not found`,
        this.getStatus(key, false, { message: 'Queue no registrada' }),
      );
    }

    try {
      const counts = await queue.getJobCounts();
      return this.getStatus(key, true, { counts });
    } catch (error) {
      throw new HealthCheckError(
        `Bull queue ${queueName} check failed`,
        this.getStatus(key, false, { message: error as string }),
      );
    }
  }
}
