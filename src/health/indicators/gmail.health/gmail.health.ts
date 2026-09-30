// indicators/gmail.health.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class GmailHealthIndicator extends HealthIndicator {
  constructor(private configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        // Agregamos un fallback (|| '') para garantizar que siempre sea un string,
        // evitando el error de tipos si la variable de entorno no existe.
        user: this.configService.get<string>('EMAIL_USER') || '',
        pass: this.configService.get<string>('EMAIL_TOKEN') || '',
      },
    });

    try {
      await transporter.verify();
      return this.getStatus(key, true);
    } catch (error) {
      // Validamos que sea una instancia de Error antes de extraer el mensaje
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido de Gmail SMTP';

      throw new HealthCheckError(
        'Gmail SMTP check failed',
        this.getStatus(key, false, { message: errorMessage }),
      );
    }
  }
}
