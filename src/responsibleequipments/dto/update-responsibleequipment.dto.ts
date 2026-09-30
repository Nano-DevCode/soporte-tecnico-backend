import { PartialType } from '@nestjs/swagger';
import { CreateResponsibleequipmentDto } from './create-responsibleequipment.dto';

export class UpdateResponsibleequipmentDto extends PartialType(
  CreateResponsibleequipmentDto,
) {}
