import { Module } from '@nestjs/common';
import { CoordinationsService } from './coordinations.service';
import { CoordinationsController } from './coordinations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coordination } from './entities/coordination.entity';

@Module({
  controllers: [CoordinationsController],
  providers: [CoordinationsService],
  imports: [TypeOrmModule.forFeature([Coordination])],
  exports: [CoordinationsService],
})
export class CoordinationsModule {}
