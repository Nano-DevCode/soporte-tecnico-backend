import { SystemNotificationService } from './system-notification.service';
import { Module } from '@nestjs/common';
import { GeneralWebsocketService } from './general-websocket.service';
import { GeneralWebsocketGateway } from './general-websocket.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { TelegramBotModule } from 'src/telegram-bot/telegram-bot.module';
import { GmailBotModule } from 'src/gmail-bot/gmail-bot.module';
import { TicketNotificationService } from './ticket-notification.service';

@Module({
  imports: [AuthModule, UsersModule, TelegramBotModule, GmailBotModule],
  providers: [
    GeneralWebsocketGateway,
    GeneralWebsocketService,
    TicketNotificationService,
    SystemNotificationService,
  ],
  exports: [GeneralWebsocketGateway],
})
export class GeneralWebsocketModule {}
