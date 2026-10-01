import { OnGlobalQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf, TelegramError } from 'telegraf';
import {
  TelegramJobData,
  TelegramJobResult,
} from '../interfaces/telegram-job.interface';

@Processor('telegram-queue')
export class TelegramProcessor {
  private readonly logger = new Logger(TelegramProcessor.name);

  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  @OnGlobalQueueFailed()
  onGlobalJobFailed(jobId: string, err: Error): void {
    this.logger.error(
      `🚨 ALERTA GLOBAL: Job de Telegram fallido (ID: ${jobId}). Razón: ${err}`,
    );
  }

  @Process({ name: 'enviar-notificacion', concurrency: 5 })
  async handleNotification(
    job: Job<TelegramJobData>,
  ): Promise<TelegramJobResult> {
    const { chatId, message, options } = job.data;

    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        ...options,
      });

      return { success: true };
    } catch (error: unknown) {
      // 1. Errores controlados de la API de Telegram
      if (error instanceof TelegramError) {
        this.logger.error(
          `Error de Telegram [${error.code}]: ${error.description}`,
        );

        // Conflicto de instancias
        if (error.code === 409) {
          this.logger.error(
            'Hay un conflicto: Se detectó otra instancia del bot corriendo. Saltando este job.',
          );
          return { success: false, reason: 'Conflict with another instance' };
        }

        // El usuario bloqueó al bot (Error terminal)
        if (error.code === 403) {
          this.logger.warn(`El usuario con ID ${chatId} ha bloqueado al bot.`);
          return { success: false, reason: 'User blocked bot' };
        }

        // Chat inexistente o petición malformada (Error terminal)
        if (error.code === 400 || error.code === 404) {
          this.logger.warn(
            `Petición inválida a Telegram [${error.code}] para ${chatId}: ${error.description}`,
          );
          return { success: false, reason: error.description };
        }

        // Rate limit: 429 Too Many Requests (Reintentable con backoff)
        if (error.code === 429) {
          throw error;
        }
      }

      // 2. Problemas de red o sistema (Reintentables)
      if (error instanceof Error) {
        this.logger.error('Error inesperado en TelegramProcessor', error.stack);
        throw error;
      }

      // 3. Error desconocido
      this.logger.error('Se produjo un error desconocido en Telegram');
      throw new Error('Unknown error', { cause: error });
    }
  }
}

// Alias para retrocompatibilidad
export const TelegramProcessorService = TelegramProcessor;
