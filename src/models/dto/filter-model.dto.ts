import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FilterModelDto {
  @ApiPropertyOptional({
    description: 'Límite máximo de modelos devueltos por página',
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
    description: 'Cantidad de registros saltados (offset) para la paginación',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  offset?: number = 0;

  @ApiPropertyOptional({
    description:
      'Término de búsqueda para filtrar modelos por coincidencia en el nombre',
    example: 'ThinkPad',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Transform(({ value }: { value: string }) => value?.trim())
  query?: string;

  @ApiPropertyOptional({
    description:
      'Filtro opcional vía Query Parameter para obtener modelos de un ID de marca específico',
    example: 'f8c3d81b-96c2-4d11-8231-1823746de552',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  brandId?: string;
}
