import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FilterEquipmentDto {
  @ApiPropertyOptional({
    description:
      'Límite máximo de elementos devueltos en la consulta de inventario',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      'Cantidad de elementos saltados (offset) para paginar los activos',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  offset?: number = 0;

  @ApiPropertyOptional({
    description:
      'Búsqueda global libre aproximada (coincide con número de inventario o descripción)',
    example: 'ITO-CC',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(100, { message: i18nValidationMessage('validation.maxLength') })
  @Transform(({ value }: { value: string }) => value?.trim())
  query?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado operativo lógico del hardware',
    example: 'true',
    enum: ['true', 'false'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría del hardware raíz en minúsculas',
    example: 'computers',
    enum: ['computers', 'printers', 'networks'],
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  category?: string;

  @ApiPropertyOptional({
    description:
      'Filtrar activos pertenecientes únicamente a un determinado departamento',
    example: 'c9b07384-e223-4956-a5e2-bb51263c4501',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUUID') })
  id_departament?: string;
}
