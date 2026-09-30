import { Module } from '@nestjs/common';
import { TicketHistoryService } from './ticket-history.service';
import { TicketHistoryController } from './ticket-history.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Status, TicketHistory } from './entities';
import { StatusController } from './status.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TicketHistory, Status])],
  controllers: [TicketHistoryController, StatusController],
  providers: [TicketHistoryService],
  exports: [TicketHistoryService],
})
export class TicketHistoryModule {}
