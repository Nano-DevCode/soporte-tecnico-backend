import { PartialType } from '@nestjs/swagger';
import { CreateEquipmenttypeDto } from './create-equipmenttype.dto';

export class UpdateEquipmenttypeDto extends PartialType(
  CreateEquipmenttypeDto,
) {}
