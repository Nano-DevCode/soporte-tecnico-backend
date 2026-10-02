import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FilterComputerProcessorDto {
  @ApiPropertyOptional({
    description: 'Límite máximo de resultados devueltos por consulta',
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
      'Desplazamiento inicial (offset) para la segmentación de la paginación',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  offset?: number = 0;

  @ApiPropertyOptional({
    description:
      'Búsqueda libre por término para filtrar por marca, modelo o descripción',
    example: 'Intel Core',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Transform(({ value }: { value: string }) => value?.trim())
  query?: string;
}
