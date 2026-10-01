import { PartialType } from '@nestjs/swagger';
import { CreateToolsMovementsOutDto } from './create-tools-movements-out.dto';

export class UpdateToolsMovementsOutDto extends PartialType(
  CreateToolsMovementsOutDto,
) {}
