import {
  Process,
  Processor,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { notificationTemplate } from './template/email.template';

interface EmailJobData {
  destinatario: string;
  asunto: string;
  mensaje: string;
}

interface MailError extends Error {
  code?: string | number;
  responseCode?: number;
  command?: string;
}

@Processor('email-queue')
export class GmailProcessorService {
  private readonly logger = new Logger('GmailProcessorService');

  constructor(private readonly mailerService: MailerService) {}

  @Process({ name: 'enviar-correo', concurrency: 5 })
  async handleEnvio(job: Job<EmailJobData>) {
    const { destinatario, asunto, mensaje } = job.data;

    try {
      await this.mailerService.sendMail({
        to: destinatario,
        subject: asunto,
        html: notificationTemplate(mensaje),
      });

      return { success: true };
    } catch (error: unknown) {
      const mailError = error as MailError;

      if (mailError.code || mailError.responseCode) {
        this.logger.error(
          `Error de SMTP/Gmail [${mailError.code}]: ${mailError.message}`,
        );

        if (mailError.code === 'EAUTH' || mailError.responseCode === 535) {
          this.logger.warn(
            `Fallo de autenticación: Verifica la contraseña de aplicación.`,
          );
        }
        if (mailError.code === 'EENVELOPE' || mailError.responseCode === 550) {
          this.logger.warn(`El destinatario ${destinatario} no es válido.`);
        }
        throw new Error(mailError.message, { cause: error });
      }

      if (error instanceof Error) {
        this.logger.error('Error inesperado en GmailProcessor', error.stack);
        throw error;
      }

      this.logger.error('Se produjo un error desconocido al enviar correo');
      throw new Error('Unknown error', { cause: error });
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<EmailJobData>) {
    this.logger.log(
      `[Job ${job.id}] Correo enviado a ${job.data.destinatario}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<EmailJobData>, err: Error) {
    this.logger.error(
      `[Job ${job.id}] Falló en la cola para ${job.data.destinatario}. Razón: ${err.message}`,
    );
  }
}
