import { PartialType } from '@nestjs/swagger';
import { CreateToolsMovementsInDto } from './create-tools-movements-in.dto';

export class UpdateToolsMovementsInDto extends PartialType(
  CreateToolsMovementsInDto,
) {}
