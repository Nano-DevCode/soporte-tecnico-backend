import { Module } from '@nestjs/common';
import { MovementAplicationsService } from './movement_aplications.service';
import { MovementAplicationsController } from './movement_aplications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementAplication } from './entities/movement_aplication.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MovementAplication])],
  controllers: [MovementAplicationsController],
  providers: [MovementAplicationsService],
  exports: [MovementAplicationsService],
})
export class MovementAplicationsModule {}
