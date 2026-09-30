import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty } from 'class-validator';
import { IsAfter } from 'src/common/decorators/IsAfter.decorator';
import { PeriodType } from '../entities/school-period.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSchoolPeriodDto {
  @ApiProperty({
    description: 'Tipo de periodo escolar',
    enum: PeriodType,
    example: PeriodType.ENERO_JUNIO,
  })
  @IsNotEmpty()
  @IsEnum(PeriodType, {
    message:
      'El tipo de periodo debe ser válido (enero-junio, verano o agosto-diciembre)',
  })
  period_type: PeriodType;

  @ApiProperty({
    description: 'Fecha de inicio del periodo escolar',
    example: '2026-01-12T00:00:00.000Z',
    format: 'date-time',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  date_start: Date;

  @ApiProperty({
    description: 'Fecha de fin del periodo escolar',
    example: '2026-06-30T23:59:59.000Z',
    format: 'date-time',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @IsAfter('date_start', {
    message: 'La fecha de fin debe ser mayor a la fecha de inicio',
  })
  date_end: Date;
}
