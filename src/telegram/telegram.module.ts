import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramService } from './services/telegram.service';
import { TelegramProcessor } from './processors/telegram.processor';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_TOKEN')!,
        launchOptions: false,
      }),
    }),
    BullModule.registerQueue({
      name: 'telegram-queue',
    }),
  ],
  providers: [TelegramService, TelegramProcessor],
  exports: [TelegramService, TelegramProcessor],
})
export class TelegramModule {}

// Alias para compatibilidad de importaciones
export const TelegramBotModule = TelegramModule;
export const TelegramProcessorModule = TelegramModule;
