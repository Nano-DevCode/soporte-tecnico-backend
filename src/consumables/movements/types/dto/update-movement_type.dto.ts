import { PartialType } from '@nestjs/swagger';
import { CreateMovementTypeDto } from './create-movement_type.dto';

export class UpdateMovementTypeDto extends PartialType(CreateMovementTypeDto) {}
