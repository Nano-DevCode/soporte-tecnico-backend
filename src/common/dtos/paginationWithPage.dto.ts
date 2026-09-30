import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { PAGINATION } from '../constants/pagination.constants';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationWithPageDto {
  @ApiPropertyOptional({
    description: 'Número máximo de elementos a retornar',
    default: PAGINATION.DEFAULT_LIMIT,
    maximum: PAGINATION.MAX_LIMIT,
  })
  @IsOptional()
  @IsPositive()
  @Max(PAGINATION.MAX_LIMIT)
  @Type(() => Number)
  limit: number = PAGINATION.DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description: 'Número de página actual',
    default: PAGINATION.DEFAULT_PAGE,
    minimum: 1,
  })
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page: number = PAGINATION.DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Término de búsqueda para filtrar resultados',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
