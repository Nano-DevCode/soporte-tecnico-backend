import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentticketDto } from './create-equipmentticket.dto';

export class UpdateEquipmentticketDto extends PartialType(
  CreateEquipmentticketDto,
) {}
