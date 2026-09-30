/* import { PartialType } from '@nestjs/mapped-types';
import { CreateItAssetsStatusDto } from './create-it-assets-status.dto';

export class UpdateItAssetsStatusDto extends PartialType(
  CreateItAssetsStatusDto,
) {}
 */

import { PartialType } from '@nestjs/swagger'; // <-- Cambiado a @nestjs/swagger
import { CreateItAssetsStatusDto } from './create-it-assets-status.dto';

export class UpdateItAssetsStatusDto extends PartialType(
  CreateItAssetsStatusDto,
) {}
