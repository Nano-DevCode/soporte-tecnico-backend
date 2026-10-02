import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FilterMovementAplicationDto {
  @ApiPropertyOptional({
    description: 'Número máximo de registros a retornar por consulta',
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
    description:
      'Cantidad de registros omitidos (offset) en la estrategia de paginación',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  offset?: number = 0;

  @ApiPropertyOptional({
    description:
      'Término de búsqueda para filtrar por coincidencia en el nombre o acrónimo',
    example: 'Centro',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Transform(({ value }: { value: string }) => value?.trim())
  query?: string;
}
