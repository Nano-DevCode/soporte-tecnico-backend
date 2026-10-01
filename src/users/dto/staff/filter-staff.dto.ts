import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FilterStaffDto {
  @ApiPropertyOptional({
    description: 'Límite de resultados por página',
    example: 10,
    default: 10,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  @Max(100, { message: i18nValidationMessage('validation.max') }) // Seguridad: Límite para proteger el rendimiento
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Cantidad de registros a omitir (offset)',
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
    description: 'Término de búsqueda libre',
    example: 'Juan',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(1, { message: i18nValidationMessage('validation.minLength') })
  @Transform(({ value }: { value: string }) => value?.trim()) // Sanitización de espacios
  query?: string;
}
