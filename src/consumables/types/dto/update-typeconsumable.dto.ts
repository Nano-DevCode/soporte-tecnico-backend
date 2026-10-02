import { PartialType } from '@nestjs/swagger';
import { CreateTypeconsumableDto } from './create-typeconsumable.dto';

export class UpdateTypeconsumableDto extends PartialType(
  CreateTypeconsumableDto,
) {}
