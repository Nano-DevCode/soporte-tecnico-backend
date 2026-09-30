import { PartialType } from '@nestjs/swagger';
import { CreatePrinterfunctiontypeDto } from './create-printerfunctiontype.dto';

export class UpdatePrinterfunctiontypeDto extends PartialType(
  CreatePrinterfunctiontypeDto,
) {}
