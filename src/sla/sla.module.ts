import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { TicketSla } from './entities/ticket-sla.entity';
import { SlaController } from './sla.controller';
import { SlaCalculatorService } from './services/sla-calculator.service';
import { SlaMonitorService } from './services/sla-monitor.service';
import { SlaTicketListener } from './listeners/sla-ticket.listener';
import { TelegramModule } from 'src/telegram/telegram.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { GeneralWebsocketModule } from 'src/general-websocket/general-websocket.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TicketSla]),
    TelegramModule,
    NotificationsModule,
    GeneralWebsocketModule,
    AuthModule,
  ],
  controllers: [SlaController],
  providers: [SlaCalculatorService, SlaMonitorService, SlaTicketListener],
  exports: [SlaCalculatorService, SlaMonitorService, TypeOrmModule],
})
export class SlaModule {}
