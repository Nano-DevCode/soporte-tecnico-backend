import { PartialType } from '@nestjs/swagger';
import { CreateComputerprocessorDto } from './create-computerprocessor.dto';

export class UpdateComputerprocessorDto extends PartialType(
  CreateComputerprocessorDto,
) {}
