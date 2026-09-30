import { Controller, UseFilters } from '@nestjs/common';
import { AttendsService } from './attends.service';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';

@UseFilters(DbexceptionFilter)
@Controller('attends')
export class AttendsController {
  constructor(private readonly attendsService: AttendsService) {}
}
