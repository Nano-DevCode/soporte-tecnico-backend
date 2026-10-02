import { PartialType } from '@nestjs/swagger';
import { CreateConsumableUbicationDto } from './create-consumable_ubication.dto';

export class UpdateConsumableUbicationDto extends PartialType(
  CreateConsumableUbicationDto,
) {}
