import { PartialType } from '@nestjs/swagger';
import { CreateComputerequipmenttypeDto } from './create-computerequipmenttype.dto';
import { IsOptional } from 'class-validator';

export class UpdateComputerequipmenttypeDto extends PartialType(
  CreateComputerequipmenttypeDto,
) {
  @IsOptional()
  name: string;
}
