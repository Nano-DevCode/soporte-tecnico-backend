import { PartialType } from '@nestjs/mapped-types';
import { CreateFaultValidityDto } from './create-fault-validity.dto';

export class UpdateFaultValidityDto extends PartialType(
  CreateFaultValidityDto,
) {}
