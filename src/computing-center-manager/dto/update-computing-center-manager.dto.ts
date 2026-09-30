import { PartialType } from '@nestjs/swagger';
import { CreateComputingCenterManagerDto } from './create-computing-center-manager.dto';

export class UpdateComputingCenterManagerDto extends PartialType(
  CreateComputingCenterManagerDto,
) {}
