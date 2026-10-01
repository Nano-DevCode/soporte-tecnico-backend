import { PartialType } from '@nestjs/swagger';
import { CreateItAssetsMovementsInDto } from './create-it-assets-movements-in.dto';

export class UpdateItAssetsMovementsInDto extends PartialType(
  CreateItAssetsMovementsInDto,
) {}
