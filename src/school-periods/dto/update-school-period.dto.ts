import { PartialType } from '@nestjs/mapped-types';
import { CreateSchoolPeriodDto } from './create-school-period.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSchoolPeriodDto extends PartialType(CreateSchoolPeriodDto) {
  @ApiPropertyOptional({
    description: 'Estado activo o inactivo del periodo escolar',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
