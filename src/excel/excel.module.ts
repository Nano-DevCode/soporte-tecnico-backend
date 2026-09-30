import { Module } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { ExcelController } from './excel.controller';
import { FilesModule } from 'src/files/files.module';
import { TicketsModule } from 'src/tickets/tickets.module';
import { SurveyModule } from 'src/survey/survey.module';

@Module({
  imports: [FilesModule, TicketsModule, SurveyModule],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
