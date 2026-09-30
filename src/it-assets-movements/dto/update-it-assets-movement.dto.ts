import { PartialType } from '@nestjs/mapped-types';
import { CreateItAssetsMovementDto } from './create-it-assets-movement.dto';

export class UpdateItAssetsMovementDto extends PartialType(
  CreateItAssetsMovementDto,
) {}
