import { PartialType } from '@nestjs/swagger';
import { CreateTicketHistoryDto } from './create-ticket-history.dto';

export class UpdateTicketHistoryDto extends PartialType(
  CreateTicketHistoryDto,
) {}
