import { Module } from '@nestjs/common';
import { MovementTypesService } from './movement_types.service';
import { MovementTypesController } from './movement_types.controller';
import { MovementType } from './entities/movement_type.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([MovementType])],
  controllers: [MovementTypesController],
  providers: [MovementTypesService],
  exports: [MovementTypesService, TypeOrmModule],
})
export class MovementTypesModule {}
