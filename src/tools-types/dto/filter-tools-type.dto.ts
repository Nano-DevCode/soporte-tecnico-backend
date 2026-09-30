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

export class FilterToolsTypeDto {
  @ApiPropertyOptional({
    description: 'Límite de registros devueltos por la consulta',
    example: 10,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  @Max(100, { message: i18nValidationMessage('validation.max') }) // Seguridad: Límite para proteger el rendimiento
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
    description: 'Búsqueda libre por nombre del tipo de herramienta',
    example: 'medición',
    minLength: 1,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(1, { message: i18nValidationMessage('validation.minLength') })
  @Transform(({ value }: { value: string }) => value?.trim()) // Sanitización de espacios
  query?: string;
}
