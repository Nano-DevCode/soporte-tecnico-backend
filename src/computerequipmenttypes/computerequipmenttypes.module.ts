import { Module } from '@nestjs/common';
import { ComputerequipmenttypesService } from './computerequipmenttypes.service';
import { ComputerequipmenttypesController } from './computerequipmenttypes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Computerequipmenttype } from './entities/computerequipmenttype.entity';
@Module({
  controllers: [ComputerequipmenttypesController],
  providers: [ComputerequipmenttypesService],
  imports: [TypeOrmModule.forFeature([Computerequipmenttype])],
  exports: [ComputerequipmenttypesService],
})
export class ComputerequipmenttypesModule {}
