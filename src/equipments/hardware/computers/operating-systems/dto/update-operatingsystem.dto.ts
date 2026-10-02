import { PartialType } from '@nestjs/swagger';
import { CreateOperatingsystemDto } from './create-operatingsystem.dto';

export class UpdateOperatingsystemDto extends PartialType(
  CreateOperatingsystemDto,
) {}
