import { PartialType } from '@nestjs/swagger';
import { CreateItAssetsMovementDto } from './create-it-assets-movement.dto';

export class UpdateItAssetsMovementDto extends PartialType(
  CreateItAssetsMovementDto,
) {}
