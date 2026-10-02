import { Module } from '@nestjs/common';
import { UnitMeasurementService } from './unit-measurement.service';
import { UnitMeasurementController } from './unit-measurement.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitMeasurement } from './entities/unit-measurement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UnitMeasurement])],
  controllers: [UnitMeasurementController],
  providers: [UnitMeasurementService],
  exports: [UnitMeasurementService, TypeOrmModule],
})
export class UnitMeasurementModule {}
