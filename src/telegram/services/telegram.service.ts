import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  TelegramJobData,
  TelegramJobResult,
  TelegramNotificationOptions,
} from '../interfaces/telegram-job.interface';

export { TelegramNotificationOptions };

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectQueue('telegram-queue') private readonly telegramQueue: Queue,
  ) {}

  async sendNotification(
    chatId: string | number,
    message: string,
    options?: TelegramNotificationOptions,
  ): Promise<TelegramJobResult> {
    try {
      const safeChatId = chatId ? String(chatId).trim() : '';
      if (!safeChatId || safeChatId.length < 4) {
        this.logger.warn(
          `Intento de enviar notificación fallido: chatId inválido o muy corto (Valor recibido: "${chatId}")`,
        );
        return {
          success: false,
          error:
            'No se puede encolar la notificación porque el chatId es inválido o menor a 4 caracteres',
        };
      }

      const jobData: TelegramJobData = {
        chatId: safeChatId,
        message,
        options,
      };

      const job = await this.telegramQueue.add('enviar-notificacion', jobData, {
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.log(
        `Notificación encolada para ${safeChatId} (Job ID: ${job.id})`,
      );

      return {
        success: true,
        message: 'Notificación encolada correctamente',
        jobId: job.id,
      };
    } catch (error) {
      this.logger.error('Error al encolar la notificación de Telegram', error);
      return {
        success: false,
        error: 'No se pudo procesar la solicitud (Error interno de cola)',
      };
    }
  }
}

// Alias para retrocompatibilidad
export const TelegramBotService = TelegramService;
