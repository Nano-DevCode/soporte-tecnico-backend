import { PartialType } from '@nestjs/mapped-types';
import { CreateItAssetsMovementsInDto } from './create-it-assets-movements-in.dto';

export class UpdateItAssetsMovementsInDto extends PartialType(
  CreateItAssetsMovementsInDto,
) {}
