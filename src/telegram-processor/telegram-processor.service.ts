import { OnGlobalQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { InjectBot } from 'nestjs-telegraf';
import { TelegramNotificationOptions } from 'src/telegram-bot/telegram-bot.service';
import { Context, Telegraf, TelegramError } from 'telegraf';

@Processor('telegram-queue')
export class TelegramProcessorService {
  private readonly logger = new Logger('TelegramProcessorService');

  // Inyectamos el Bot AQUÍ, ya no en el servicio
  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  @OnGlobalQueueFailed()
  onGlobalJobFailed(jobId: string, err: Error) {
    this.logger.error(
      `🚨 ALERTA GLOBAL: Job de Telegram fallido (ID: ${jobId}). Razón: ${err}`,
    );
  }

  @Process({ name: 'enviar-notificacion', concurrency: 5 })
  async handleNotification(
    job: Job<{
      chatId: string | number;
      message: string;
      options?: TelegramNotificationOptions;
    }>,
  ) {
    const { chatId, message, options } = job.data;
    // this.logger.debug(`Procesando mensaje para: ${chatId}`);

    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        ...options,
      });

      // this.logger.debug(messageresponse);
      // Si todo sale bien
      return { success: true };
    } catch (error: unknown) {
      // --- TU LÓGICA ORIGINAL DE ERRORES ---
      // 1. Errores de Telegram (Bloqueo, chat no existe, etc)
      if (error instanceof TelegramError) {
        this.logger.error(
          `Error de Telegram [${error.code}]: ${error.description}`,
        );

        if (error.code === 409) {
          this.logger.error(
            'Hay un conflicto: Se detectó otra instancia del bot corriendo. Saltando este job.',
          );
          return { success: false, reason: 'Conflict with another instance' };
        }

        if (error.code === 403) {
          this.logger.warn(`El usuario con ID ${chatId} ha bloqueado al bot.`);
          // IMPORTANTE: Si el usuario nos bloqueó, NO lanzamos error (throw)
          // porque no queremos que Bull intente reenviarlo 3 veces. Ya sabemos que fallará.
          return { success: false, reason: 'User blocked bot' };
        }
        // Para otros errores de Telegram (ej. 429 Too Many Requests), sí lanzamos error
        // para que Bull lo reintente más tarde.
        if (error.code === 429) {
          throw error;
        }
      }

      // 2. Problemas de red o sistema
      if (error instanceof Error) {
        this.logger.error('Error inesperado en TelegramProcessor', error.stack);
        throw error; // Lanzamos para que Bull reintente
      }

      // 3. Error desconocido
      this.logger.error('Se produjo un error desconocido en Telegram');
      throw new Error('Unknown error', { cause: error });
    }
  }
}
