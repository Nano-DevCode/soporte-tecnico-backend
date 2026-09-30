import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { NotificationJobData } from './notifications.processor';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    @InjectQueue('notifications')
    private readonly notificationsQueue: Queue<NotificationJobData>,
  ) {}

  @OnEvent('notification.send', { async: true })
  async handleNotificationEvent(payload: NotificationJobData) {
    this.logger.debug(
      `Recibido evento de notificación para el usuario ${payload.userId}`,
    );
    try {
      await this.notificationsQueue.add('send', payload, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al encolar notificación: ${errorMessage}`);
    }
  }
}
