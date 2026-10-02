import { Module } from '@nestjs/common';
import { PauseReportsService } from './pause-reports.service';
import { PauseReportsController } from './pause-reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PauseReport } from './entities/pause-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PauseReport])],
  controllers: [PauseReportsController],
  providers: [PauseReportsService],
  exports: [PauseReportsService],
})
export class PauseReportsModule {}
