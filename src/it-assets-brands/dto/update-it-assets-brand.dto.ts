/* import { PartialType } from '@nestjs/mapped-types';
import { CreateItAssetsBrandDto } from './create-it-assets-brand.dto';

export class UpdateItAssetsBrandDto extends PartialType(
  CreateItAssetsBrandDto,
) {}
 */

import { PartialType } from '@nestjs/swagger'; // <-- Cambiado
import { CreateItAssetsBrandDto } from './create-it-assets-brand.dto';

export class UpdateItAssetsBrandDto extends PartialType(
  CreateItAssetsBrandDto,
) {}
