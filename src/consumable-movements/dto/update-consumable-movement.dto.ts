import { PartialType } from '@nestjs/swagger';
import { CreateConsumableMovementDto } from './create-consumable-movement.dto';

export class UpdateConsumableMovementDto extends PartialType(
  CreateConsumableMovementDto,
) {}
