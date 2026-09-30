/* import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffDto } from './create-staff.dto';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}
 */

import { PartialType } from '@nestjs/swagger'; // <-- Cambio aplicado aquí
import { CreateStaffDto } from './create-staff.dto';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}
