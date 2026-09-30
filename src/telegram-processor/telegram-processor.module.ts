import { Module } from '@nestjs/common';
import { TelegramProcessorService } from './telegram-processor.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Configuracion de Telegram
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_TOKEN')!,
        launchOptions: false,
      }),
    }),
  ],
  providers: [TelegramProcessorService],
  exports: [TelegramProcessorService],
})
export class TelegramProcessorModule {}
