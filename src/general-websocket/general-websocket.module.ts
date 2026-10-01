import { SystemNotificationService } from './system-notification.service';
import { Module } from '@nestjs/common';
import { GeneralWebsocketService } from './general-websocket.service';
import { GeneralWebsocketGateway } from './general-websocket.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { GmailModule } from 'src/gmail/gmail.module';
import { TicketNotificationService } from './ticket-notification.service';

@Module({
  imports: [AuthModule, UsersModule, TelegramModule, GmailModule],
  providers: [
    GeneralWebsocketGateway,
    GeneralWebsocketService,
    TicketNotificationService,
    SystemNotificationService,
  ],
  exports: [GeneralWebsocketGateway],
})
export class GeneralWebsocketModule {}
