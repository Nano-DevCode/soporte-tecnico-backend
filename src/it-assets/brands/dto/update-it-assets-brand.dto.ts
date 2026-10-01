import { PartialType } from '@nestjs/swagger';
import { CreateItAssetsBrandDto } from './create-it-assets-brand.dto';

export class UpdateItAssetsBrandDto extends PartialType(
  CreateItAssetsBrandDto,
) {}
