import { PartialType } from '@nestjs/swagger';
import { CreateToolsTypeDto } from './create-tools-type.dto';

export class UpdateToolsTypeDto extends PartialType(CreateToolsTypeDto) {}
