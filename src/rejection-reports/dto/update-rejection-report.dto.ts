import { PartialType } from '@nestjs/mapped-types';
import { CreateRejectionReportDto } from './create-rejection-report.dto';

export class UpdateRejectionReportDto extends PartialType(
  CreateRejectionReportDto,
) {}
