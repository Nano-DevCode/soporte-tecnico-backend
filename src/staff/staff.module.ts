import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Staff } from './entities/staff.entity';
import { TechnicianKpi } from './entities/technician-kpi.entity';
import { TechnicianKpiProcessor } from './technician-kpi.processor';
import { TechnicianKpiService } from './technician-kpi.service';

@Module({
  controllers: [StaffController],
  providers: [StaffService, TechnicianKpiProcessor, TechnicianKpiService],
  imports: [
    TypeOrmModule.forFeature([Staff, TechnicianKpi]),
    BullModule.registerQueue({
      name: 'kpi-queue',
    }),
  ],
  exports: [StaffService, TechnicianKpiService],
})
export class StaffModule {}
