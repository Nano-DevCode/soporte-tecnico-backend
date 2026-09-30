import { Controller, UseFilters } from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';

@UseFilters(DbexceptionFilter)
@Controller('responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}
}
