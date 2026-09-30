import { Controller, UseFilters } from '@nestjs/common';
import { TicketHistoryService } from './ticket-history.service';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';

@UseFilters(DbexceptionFilter)
@Controller('ticket-history')
export class TicketHistoryController {
  constructor(private readonly ticketHistoryService: TicketHistoryService) {}
}
