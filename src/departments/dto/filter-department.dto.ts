import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FilterDepartmentDto {
  @ApiPropertyOptional({
    description: 'Límite de resultados a devolver',
    example: 10,
    default: 10,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  @Max(50, { message: i18nValidationMessage('validation.max') })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Cantidad de registros a saltar para paginación',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Término de búsqueda libre por nombre o acrónimo',
    example: 'Sistemas',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(100, { message: i18nValidationMessage('validation.maxLength') })
  @MinLength(1, { message: i18nValidationMessage('validation.minLength') })
  @Transform(({ value }: { value: string }) => value?.trim()) // Sanitización de espacios
  query?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado (true=activos, false=inactivos)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as boolean;
  })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  status?: boolean;
}
