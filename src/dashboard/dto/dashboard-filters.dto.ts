import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsUUID,
  IsPositive,
  IsInt,
  IsArray,
} from 'class-validator';
import { IsAfter } from 'src/common/decorators/IsAfter.decorator';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';

export class DashboardFiltersDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado del ticket',
    enum: TicketStatus,
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por prioridad del ticket',
    type: String,
    example: 'Alta',
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID (UUID) del periodo escolar',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  school_period?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID (UUID) del departamento',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  department?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID numérico del tipo de problema',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  issue_type?: number;

  @ApiPropertyOptional({
    description: 'Fecha de inicio para el rango de búsqueda (YYYY-MM-DD)',
    type: String,
    format: 'date',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description:
      'Fecha de fin para el rango de búsqueda (YYYY-MM-DD). Debe ser posterior a start_date',
    type: String,
    format: 'date',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsDateString()
  @IsAfter('start_date', { allowEqual: true })
  end_date?: string;

  @ApiPropertyOptional({
    description:
      'Filtrar por etiquetas. Puede ser un arreglo de strings o un string separado por comas',
    type: [String],
    example: ['HARDWARE', 'REDES'],
  })
  @IsOptional()
  @Transform(({ value }): string[] | undefined => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (Array.isArray(value)) {
      return value as string[];
    }
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
