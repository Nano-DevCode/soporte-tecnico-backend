import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class GmailBotService {
  private readonly logger = new Logger('GmailBotService');

  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  async sendEmail(destinatario: string, asunto: string, mensaje: string) {
    try {
      // AQUI OCURRE LA MAGIA: .add() tarda milisegundos
      const job = await this.emailQueue.add(
        'enviar-correo',
        {
          destinatario,
          asunto,
          mensaje,
        },
        {
          attempts: 3, // Si falla, reintenta 3 veces automáticamente
          backoff: 5000, // Espera 5 segundos entre intentos
          removeOnComplete: true, // Borra el registro de Redis si sale bien (ahorra memoria)
          removeOnFail: false, // Mantenlo si falla para poder inspeccionar
        },
      );

      this.logger.log(
        `Trabajo de correo encolado con ID: ${job.id} destinatario: ${destinatario}`,
      );
      // Retornamos éxito inmediato al usuario, aunque el correo se envíe en 2 segundos
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
