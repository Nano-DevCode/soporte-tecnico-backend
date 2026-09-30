import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'telegram-queue',
    }),
  ],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
