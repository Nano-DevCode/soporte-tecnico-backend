import { PartialType } from '@nestjs/swagger';
import { CreateItAssetsTypeDto } from './create-it-assets-type.dto';

export class UpdateItAssetsTypeDto extends PartialType(CreateItAssetsTypeDto) {}
