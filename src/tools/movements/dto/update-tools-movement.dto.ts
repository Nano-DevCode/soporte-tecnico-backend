import { PartialType } from '@nestjs/swagger';
import { CreateToolsMovementDto } from './create-tools-movement.dto';

export class UpdateToolsMovementDto extends PartialType(
  CreateToolsMovementDto,
) {}
