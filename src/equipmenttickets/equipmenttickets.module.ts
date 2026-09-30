import { Module } from '@nestjs/common';
import { EquipmentticketsService } from './equipmenttickets.service';
import { EquipmentticketsController } from './equipmenttickets.controller';

@Module({
  controllers: [EquipmentticketsController],
  providers: [EquipmentticketsService],
})
export class EquipmentticketsModule {}
