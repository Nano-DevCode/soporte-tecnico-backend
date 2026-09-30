import { PartialType } from '@nestjs/mapped-types';
import { CreateItAssetsMovementsOutDto } from './create-it-assets-movements-out.dto';

export class UpdateItAssetsMovementsOutDto extends PartialType(
  CreateItAssetsMovementsOutDto,
) {}
