import {
  Process,
  Processor,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { notificationTemplate } from '../templates/email.template';
import {
  EmailJobData,
  EmailJobResult,
  MailError,
} from '../interfaces/email-job.interface';

@Processor('email-queue')
export class GmailProcessor {
  private readonly logger = new Logger(GmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process({ name: 'enviar-correo', concurrency: 5 })
  async handleEnvio(job: Job<EmailJobData>): Promise<EmailJobResult> {
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

      // 1. Manejo de errores específicos de SMTP
      if (mailError.code || mailError.responseCode) {
        this.logger.error(
          `Error de SMTP/Gmail [${mailError.code}]: ${mailError.message}`,
        );

        // Errores terminales (No reintentar):
        // 535 / EAUTH: Credenciales incorrectas
        if (mailError.code === 'EAUTH' || mailError.responseCode === 535) {
          this.logger.warn(
            'Fallo de autenticación: Verifica la contraseña de aplicación.',
          );
          return {
            success: false,
            reason: 'Authentication failure (EAUTH/535)',
          };
        }

        // 550 / EENVELOPE: Buzón inexistente o rechazado por el servidor destino
        if (mailError.code === 'EENVELOPE' || mailError.responseCode === 550) {
          this.logger.warn(`El destinatario ${destinatario} no es válido.`);
          return {
            success: false,
            reason: `Invalid recipient (EENVELOPE/550): ${destinatario}`,
          };
        }

        // Para otros errores SMTP (ej. 421 servicio no disponible temporalmente, timeouts de socket), reintentar
        throw new Error(mailError.message, { cause: error });
      }

      // 2. Errores genéricos de JavaScript / Red (reintentables)
      if (error instanceof Error) {
        this.logger.error('Error inesperado en GmailProcessor', error.stack);
        throw error;
      }

      // 3. Error desconocido
      this.logger.error('Se produjo un error desconocido al enviar correo');
      throw new Error('Unknown error', { cause: error });
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job<EmailJobData>): void {
    this.logger.log(
      `[Job ${job.id}] Correo enviado a ${job.data.destinatario}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<EmailJobData>, err: Error): void {
    this.logger.error(
      `[Job ${job.id}] Falló en la cola para ${job.data.destinatario}. Razón: ${err.message}`,
    );
  }
}

// Alias para retrocompatibilidad
export const GmailProcessorService = GmailProcessor;
