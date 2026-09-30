import { Module } from '@nestjs/common';
import { FaultValiditiesService } from './fault-validities.service';
import { FaultValiditiesController } from './fault-validities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaultValidity } from './entities/fault-validity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FaultValidity])],
  controllers: [FaultValiditiesController],
  providers: [FaultValiditiesService],
  exports: [FaultValiditiesService],
})
export class FaultValiditiesModule {}
