import { Module } from '@nestjs/common';
import { GmailProcessorService } from './gmail-processor.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [GmailProcessorService],
  exports: [GmailProcessorService],
  imports: [
    // Configuracion de Correo
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          pool: true,
          secure: true,
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_TOKEN'),
          },
        },
        defaults: {
          from: `"Soporte Tecnico" <${configService.get<string>('EMAIL_USER')}>`,
        },
      }) as any,
    }),
  ],
})
export class GmailProcessorModule {}
