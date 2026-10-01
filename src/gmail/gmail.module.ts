import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GmailService } from './services/gmail.service';
import { GmailProcessor } from './processors/gmail.processor';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
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
        }) as unknown as import('@nestjs-modules/mailer').MailerOptions,
    }),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [GmailService, GmailProcessor],
  exports: [GmailService, GmailProcessor],
})
export class GmailModule {}

export const GmailBotModule = GmailModule;
export const GmailProcessorModule = GmailModule;
