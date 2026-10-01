import { PartialType } from '@nestjs/swagger';
import { CreateItAssetsMovementsOutDto } from './create-it-assets-movements-out.dto';

export class UpdateItAssetsMovementsOutDto extends PartialType(
  CreateItAssetsMovementsOutDto,
) {}
