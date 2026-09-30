import { PartialType } from '@nestjs/swagger';
import { CreateBrandConsumableDto } from './create-brand-consumable.dto';

export class UpdateBrandConsumableDto extends PartialType(
  CreateBrandConsumableDto,
) {}
