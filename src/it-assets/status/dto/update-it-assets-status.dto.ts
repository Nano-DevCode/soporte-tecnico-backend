import { PartialType } from '@nestjs/swagger';
import { CreateItAssetsStatusDto } from './create-it-assets-status.dto';

export class UpdateItAssetsStatusDto extends PartialType(
  CreateItAssetsStatusDto,
) {}
