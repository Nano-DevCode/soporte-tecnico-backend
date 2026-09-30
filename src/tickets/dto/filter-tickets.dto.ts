import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsPositive,
  IsInt,
  IsDateString,
  IsArray,
} from 'class-validator';
import { SortOrder } from 'src/common/constants/pagination.constants';
import { IsAfter } from 'src/common/decorators/IsAfter.decorator';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';

export class FilterTicketsDto extends PaginationWithPageDto {
  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar los resultados.',
    example: 'created_at',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Orden de clasificación (ascendente o descendente).',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Filtro por estado del ticket.',
    example: 'IN_PROGRESS',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filtro por nivel de prioridad.',
    example: '1',
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({
    description: 'Filtro por identificador de periodo escolar (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  school_period?: string;

  @ApiPropertyOptional({
    description: 'Filtro por identificador de departamento (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  department?: string;

  @ApiPropertyOptional({
    description: 'Filtro por identificador de tipo de problema.',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  issue_type?: number;

  @ApiPropertyOptional({
    description: 'Fecha de inicio para el filtrado por rango.',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin para el filtrado por rango.',
    example: '2026-06-30',
  })
  @IsOptional()
  @IsDateString()
  @IsAfter('start_date', { allowEqual: true })
  end_date?: string;

  @ApiPropertyOptional({
    description:
      'Lista de etiquetas para filtrar tickets, separadas por coma o como array.',
    type: [String],
    example: ['URGENTE', 'HARDWARE'],
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
