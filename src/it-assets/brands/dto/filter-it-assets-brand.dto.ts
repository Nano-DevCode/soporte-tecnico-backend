import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FilterItAssetsBrandDto {
  @ApiPropertyOptional({
    description: 'Límite de registros devueltos por la consulta',
    example: 10,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  @Max(100, { message: i18nValidationMessage('validation.max') })
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
    description: 'Búsqueda libre por nombre de la marca',
    example: 'hp',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Transform(({ value }: { value: string }) => value?.trim())
  query?: string;
}
