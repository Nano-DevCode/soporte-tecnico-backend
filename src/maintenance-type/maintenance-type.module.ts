import { Module } from '@nestjs/common';
import { MaintenanceTypeService } from './maintenance-type.service';
import { MaintenanceTypeController } from './maintenance-type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceType } from './entities/maintenance-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceType])],
  controllers: [MaintenanceTypeController],
  providers: [MaintenanceTypeService],
  exports: [MaintenanceTypeService],
})
export class MaintenanceTypeModule {}
