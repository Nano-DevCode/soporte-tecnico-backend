import { PartialType } from '@nestjs/swagger';
import { CreateToolsStatusDto } from './create-tools-status.dto';

export class UpdateToolsStatusDto extends PartialType(CreateToolsStatusDto) {}
