/* import { PartialType } from '@nestjs/mapped-types';
import { CreateItAssetDto } from './create-it-asset.dto';

export class UpdateItAssetDto extends PartialType(CreateItAssetDto) {}
 */

import { PartialType } from '@nestjs/swagger';
import { CreateItAssetDto } from './create-it-asset.dto';

export class UpdateItAssetDto extends PartialType(CreateItAssetDto) {}
