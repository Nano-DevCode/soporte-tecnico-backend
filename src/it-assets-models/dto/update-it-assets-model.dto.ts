/* import { PartialType } from '@nestjs/mapped-types';
import { CreateItAssetsModelDto } from './create-it-assets-model.dto';

export class UpdateItAssetsModelDto extends PartialType(
  CreateItAssetsModelDto,
) {} */

import { PartialType } from '@nestjs/swagger'; // <-- Cambiado a @nestjs/swagger
import { CreateItAssetsModelDto } from './create-it-assets-model.dto';

export class UpdateItAssetsModelDto extends PartialType(
  CreateItAssetsModelDto,
) {}
