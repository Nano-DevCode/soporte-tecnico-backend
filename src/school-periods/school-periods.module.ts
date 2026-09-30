import { Module } from '@nestjs/common';
import { SchoolPeriodsService } from './school-periods.service';
import { SchoolPeriodsController } from './school-periods.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolPeriod } from './entities/school-period.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolPeriod])],
  controllers: [SchoolPeriodsController],
  providers: [SchoolPeriodsService],
  exports: [SchoolPeriodsService],
})
export class SchoolPeriodsModule {}
