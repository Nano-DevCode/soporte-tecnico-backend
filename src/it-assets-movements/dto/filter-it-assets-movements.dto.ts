import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MovementType } from '../entities/it-assets-movement.entity';

export class FilterItAssetsMovementsDto {
  @ApiPropertyOptional({
    description: 'Límite de registros devueltos',
    example: 10,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  @Max(100, { message: i18nValidationMessage('validation.max') }) // Seguridad: Evita consultas masivas
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Cantidad de registros a saltar para la paginación',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Término de búsqueda libre',
    example: 'Laptop',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Transform(({ value }: { value: string }) => value?.trim())
  query?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de movimiento',
    enum: MovementType,
  })
  @IsOptional()
  @IsEnum(MovementType, { message: i18nValidationMessage('validation.isEnum') })
  type?: MovementType;

  @ApiPropertyOptional({
    description: 'Fecha de inicio para el rango de búsqueda (ISO 8601)',
    example: '2026-06-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin para el rango de búsqueda (ISO 8601)',
    example: '2026-06-30T23:59:59Z',
  })
  @IsOptional()
  @IsDateString({}, { message: i18nValidationMessage('validation.isDate') })
  endDate?: string;
}
