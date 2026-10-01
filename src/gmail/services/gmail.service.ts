import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  EmailJobData,
  EmailJobResult,
} from '../interfaces/email-job.interface';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);

  constructor(@InjectQueue('email-queue') private readonly emailQueue: Queue) {}

  async sendEmail(
    destinatario: string,
    asunto: string,
    mensaje: string,
  ): Promise<EmailJobResult> {
    try {
      const trimmedRecipient = destinatario ? destinatario.trim() : '';
      if (!trimmedRecipient || !trimmedRecipient.includes('@')) {
        this.logger.warn(
          `Intento de enviar correo fallido: destinatario inválido ("${destinatario}")`,
        );
        return {
          success: false,
          error: 'Destinatario de correo inválido',
        };
      }

      const jobData: EmailJobData = {
        destinatario: trimmedRecipient,
        asunto,
        mensaje,
      };

      const job = await this.emailQueue.add('enviar-correo', jobData, {
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.log(
        `Trabajo de correo encolado con ID: ${job.id} destinatario: ${trimmedRecipient}`,
      );

      return {
        success: true,
        message: 'Correo encolado para envío',
        jobId: job.id,
      };
    } catch (error) {
      this.logger.error('Error al encolar el correo', error);
      return { success: false, error: 'No se pudo encolar el correo' };
    }
  }
}

// Alias para retrocompatibilidad
export const GmailBotService = GmailService;
