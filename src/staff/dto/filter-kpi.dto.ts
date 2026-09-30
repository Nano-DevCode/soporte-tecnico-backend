import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

// Enumeradores para asegurar que el frontend envíe valores correctos
export enum KpiSortBy {
  EFFECTIVENESS = 'effectiveness',
  PENDING = 'pending',
  SPEED = 'speed',
  ASSIGNED = 'assigned',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum PerformanceStatus {
  EXCELLENT = 'excellent',
  REGULAR = 'regular',
  ATTENTION = 'attention',
}

export class FilterKpiDto {
  @ApiPropertyOptional({
    description: 'Límite de resultados por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  @Max(100, { message: i18nValidationMessage('validation.max') })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Cantidad de registros a omitir (offset)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Término de búsqueda libre',
    example: 'Juan',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(1, { message: i18nValidationMessage('validation.minLength') })
  @Transform(({ value }: { value: string }) => value?.trim())
  query?: string;

  @ApiPropertyOptional({
    description:
      'Mínimo de tickets asignados (Para ocultar técnicos inactivos)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  minAssigned?: number;

  @ApiPropertyOptional({
    enum: PerformanceStatus,
    description: 'Filtrar por color/estado del semáforo',
  })
  @IsOptional()
  @IsEnum(PerformanceStatus, {
    message: i18nValidationMessage('validation.isEnum'),
  })
  performanceStatus?: PerformanceStatus;

  @ApiPropertyOptional({
    enum: KpiSortBy,
    description: 'Criterio principal para ordenar los resultados',
  })
  @IsOptional()
  @IsEnum(KpiSortBy, { message: i18nValidationMessage('validation.isEnum') })
  sortBy?: KpiSortBy;

  @ApiPropertyOptional({
    enum: SortOrder,
    description: 'Dirección del ordenamiento (ASC o DESC)',
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: i18nValidationMessage('validation.isEnum') })
  order?: SortOrder;
}
