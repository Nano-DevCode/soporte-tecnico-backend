import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull'; // <--- IMPORTANTE
import { GmailBotService } from './gmail-bot.service';
import { GmailProcessorModule } from 'src/gmail-processor/gmail-processor.module';

@Module({
  imports: [
    GmailProcessorModule,
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [GmailBotService],
  exports: [GmailBotService],
})
export class GmailBotModule {}
