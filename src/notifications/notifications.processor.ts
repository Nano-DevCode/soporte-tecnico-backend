import { Process, Processor } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { GeneralWebsocketGateway } from '../general-websocket/general-websocket.gateway';
import { NotificationType } from './entities/notification.entity';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { UsersService } from '../users/users.service';

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  entityId?: string;
}

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly websocketGateway: GeneralWebsocketGateway,
    private readonly usersService: UsersService,
  ) {}

  @Process('send')
  async handleSendNotification(job: Job<NotificationJobData>) {
    this.logger.debug(
      `Procesando notificación para usuario ${job.data.userId}`,
    );
    try {
      const { userId, title, message, type, entityId } = job.data;
      const notificationType = type || NotificationType.GENERAL;

      try {
        const preferences = await this.usersService.getPreferences(userId);
        if (preferences[notificationType] === false) {
          this.logger.debug(
            `Notificación ${notificationType} omitida para el usuario ${userId} debido a sus preferencias.`,
          );
          return;
        }
      } catch {
        this.logger.warn(
          `No se pudieron obtener preferencias para usuario ${userId}, continuando con notificación.`,
        );
      }

      // 1. Guardar en Base de Datos
      const notification = await this.notificationsService.create({
        userId,
        title,
        message,
        type: notificationType,
        entityId,
      });

      // 2. Emitir por WebSocket
      this.websocketGateway.emitToUser(
        userId,
        'new_notification',
        notification,
      );

      this.logger.debug(`Notificación guardada y enviada a usuario ${userId}.`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error procesando notificación: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Error procesando notificación: ${String(error)}`);
      }
      throw error;
    }
  }
}
