import { Module } from '@nestjs/common';
import { RejectionReportsService } from './rejection-reports.service';
import { RejectionReportsController } from './rejection-reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RejectionReport } from './entities/rejection-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RejectionReport])],
  controllers: [RejectionReportsController],
  providers: [RejectionReportsService],
  exports: [RejectionReportsService],
})
export class RejectionReportsModule {}
