import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FilterEquipmenttypeDto {
  @ApiPropertyOptional({
    description: 'Límite de registros máximos por página de consulta',
    example: 10,
    default: 10,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  @Max(100, { message: i18nValidationMessage('validation.max') })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Número de elementos saltados (offset) en la paginación',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  offset?: number = 0;

  @ApiPropertyOptional({
    description:
      'Parámetro de búsqueda libre para filtrar los tipos de equipo globales por coincidencia de nombre',
    example: 'Red',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Transform(({ value }: { value: string }) => value?.trim())
  query?: string;
}
