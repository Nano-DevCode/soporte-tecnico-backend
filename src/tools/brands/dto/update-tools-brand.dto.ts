import { PartialType } from '@nestjs/swagger';
import { CreateToolsBrandDto } from './create-tools-brand.dto';

export class UpdateToolsBrandDto extends PartialType(CreateToolsBrandDto) {}
