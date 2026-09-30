import { PartialType } from '@nestjs/swagger';
import { CreateMaintenanceTypeDto } from './create-maintenance-type.dto';

export class UpdateMaintenanceTypeDto extends PartialType(
  CreateMaintenanceTypeDto,
) {}
