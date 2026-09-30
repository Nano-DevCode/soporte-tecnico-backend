import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

export interface TelegramNotificationOptions {
  reply_markup?: {
    inline_keyboard: Array<
      Array<{
        text: string;
        url: string;
      }>
    >;
  };
}

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    // Inyectamos la cola 'telegram-queue' que registramos en el módulo
    @InjectQueue('telegram-queue') private readonly telegramQueue: Queue,
  ) {}

  async sendNotification(
    chatId: string | number,
    message: string,
    options?: TelegramNotificationOptions,
  ) {
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
      // 1. Agregamos el trabajo a la cola
      // 'enviar-notificacion' es el nombre del trabajo que el Processor debe escuchar
      const job = await this.telegramQueue.add(
        'enviar-notificacion',
        {
          chatId,
          message,
          options,
        },
        {
          attempts: 3, // Si falla (ej. sin internet), reintenta 3 veces
          backoff: 5000, // Espera 5 segundos entre reintentos
          removeOnComplete: true, // Borra el registro de Redis si sale bien (ahorra memoria)
          removeOnFail: false, // Guárdalo si falla para que puedas revisarlo
        },
      );

      this.logger.log(
        `Notificación encolada para ${chatId} (Job ID: ${job.id})`,
      );

      // 2. Respondemos INMEDIATAMENTE al usuario (frontend/postman)
      // No esperamos a que Telegram responda, solo confirmamos que ya está en la fila.
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
