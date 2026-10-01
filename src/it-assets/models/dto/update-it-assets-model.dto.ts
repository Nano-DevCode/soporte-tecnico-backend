import { PartialType } from '@nestjs/swagger';
import { CreateItAssetsModelDto } from './create-it-assets-model.dto';

export class UpdateItAssetsModelDto extends PartialType(
  CreateItAssetsModelDto,
) {}
