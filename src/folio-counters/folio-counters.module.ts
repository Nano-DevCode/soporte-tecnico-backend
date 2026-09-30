import { Module } from '@nestjs/common';
import { FolioCountersService } from './folio-counters.service';
import { FolioCountersController } from './folio-counters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolioCounter } from './entities/folio-counter.entity';
import { SchoolPeriodsModule } from 'src/school-periods/school-periods.module';
import { DepartmentsModule } from 'src/departments/departments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FolioCounter]),
    SchoolPeriodsModule,
    DepartmentsModule,
  ],
  controllers: [FolioCountersController],
  providers: [FolioCountersService],
  exports: [FolioCountersService],
})
export class FolioCountersModule {}
