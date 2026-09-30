import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FilterConsumablemovementDto {
  @ApiPropertyOptional({
    description: 'Paginación: Cantidad de movimientos a retornar por consulta',
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
    description: 'Paginación: Desplazamiento inicial de registros (offset)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  offset?: number = 0;

  @ApiPropertyOptional({
    description:
      'Filtrar por coincidencia en el código de control o campo observaciones',
    example: 'CC-OUT',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Transform(({ value }: { value: string }) => value?.trim())
  query?: string;

  @ApiPropertyOptional({
    description:
      'Filtrar exclusivamente por tipo de movimiento (1: Entrada, 2: Salida)',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  id_movement_type?: number;

  @ApiPropertyOptional({
    description:
      'Filtrar por identificador de destino o aplicación del movimiento',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  id_movement_aplication?: number;

  @ApiPropertyOptional({
    description:
      'Filtrar transacciones destinadas a un departamento específico (UUID)',
    example: 'f1b07384-e223-4956-a5e2-bb51263c4522',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUUID') })
  id_departament_consumable?: string;

  @ApiPropertyOptional({
    description:
      'Límite inferior del rango de fechas para reportes de inventario (ISO 8601 / Date)',
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage('validation.isDate') })
  startDate?: Date;

  @ApiPropertyOptional({
    description:
      'Límite superior del rango de fechas para reportes de inventario (ISO 8601 / Date)',
    example: '2026-06-30T23:59:59.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: i18nValidationMessage('validation.isDate') })
  endDate?: Date;
}
