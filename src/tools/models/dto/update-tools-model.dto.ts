import { PartialType } from '@nestjs/swagger';
import { CreateToolsModelDto } from './create-tools-model.dto';

export class UpdateToolsModelDto extends PartialType(CreateToolsModelDto) {}
