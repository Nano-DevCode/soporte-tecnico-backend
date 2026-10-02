import { Module } from '@nestjs/common';
import { EquipmenttypesService } from './equipmenttypes.service';
import { EquipmenttypesController } from './equipmenttypes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Equipmenttype } from './entities/equipmenttype.entity';
@Module({
  controllers: [EquipmenttypesController],
  providers: [EquipmenttypesService],
  imports: [TypeOrmModule.forFeature([Equipmenttype])],
  exports: [TypeOrmModule, EquipmenttypesService],
})
export class EquipmenttypesModule {}
