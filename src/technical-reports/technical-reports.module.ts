import { Module } from '@nestjs/common';
import { TechnicalReportsService } from './technical-reports.service';
import { TechnicalReportsController } from './technical-reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicalReport } from './entities/technical-report.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { TechnicalReportsCrudService } from './services/technical-reports-crud.service';
import { TechnicalReportsKnowledgeBaseService } from './services/technical-reports-knowledge-base.service';
import { FaultValiditiesModule } from './fault-validities/fault-validities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TechnicalReport, Ticket]),
    FaultValiditiesModule,
  ],
  controllers: [TechnicalReportsController],
  providers: [
    TechnicalReportsService,
    TechnicalReportsCrudService,
    TechnicalReportsKnowledgeBaseService,
  ],
  exports: [
    TechnicalReportsService,
    TechnicalReportsCrudService,
    TechnicalReportsKnowledgeBaseService,
    FaultValiditiesModule,
    TypeOrmModule,
  ],
})
export class TechnicalReportsModule {}
