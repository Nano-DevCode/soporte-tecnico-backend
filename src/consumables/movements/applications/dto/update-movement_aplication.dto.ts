import { PartialType } from '@nestjs/swagger';
import { CreateMovementAplicationDto } from './create-movement_aplication.dto';

export class UpdateMovementAplicationDto extends PartialType(
  CreateMovementAplicationDto,
) {}
