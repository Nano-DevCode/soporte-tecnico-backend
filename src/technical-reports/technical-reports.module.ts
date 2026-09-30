import { Module } from '@nestjs/common';
import { TechnicalReportsService } from './technical-reports.service';
import { TechnicalReportsController } from './technical-reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicalReport } from './entities/technical-report.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TechnicalReport, Ticket])],
  controllers: [TechnicalReportsController],
  providers: [TechnicalReportsService],
  exports: [TechnicalReportsService],
})
export class TechnicalReportsModule {}
