import { Controller, UseFilters } from '@nestjs/common';
import { PauseReportsService } from './pause-reports.service';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';

@UseFilters(DbexceptionFilter)
@Controller('pause-reports')
export class PauseReportsController {
  constructor(private readonly pauseReportsService: PauseReportsService) {}

  // @Post()
  // create(@Body() createPauseReportDto: CreatePauseReportDto) {
  //   return this.pauseReportsService.create(createPauseReportDto);
  // }
}
