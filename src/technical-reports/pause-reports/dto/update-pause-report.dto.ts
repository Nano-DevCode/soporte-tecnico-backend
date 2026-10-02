import { PartialType } from '@nestjs/mapped-types';
import { CreatePauseReportDto } from './create-pause-report.dto';

export class UpdatePauseReportDto extends PartialType(CreatePauseReportDto) {}
