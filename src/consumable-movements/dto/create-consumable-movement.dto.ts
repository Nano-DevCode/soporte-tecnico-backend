import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ConsumableItemDto {
  @ApiProperty({
    description: 'UUID del consumible que va a egresar del inventario',
    example: 'c2b07384-e223-4956-a5e2-bb51263c4577',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  id_consumable: string;

  @ApiProperty({
    description: 'Cantidad exacta solicitada para despacho',
    example: 1,
  })
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  quantity_consumable: number;
}

export class CreateConsumableMovementDto {
  @ApiProperty({
    description:
      'ID numérico del tipo de aplicación de destino (Ej: 2=Ticket, 3=Uso Interno, etc.)',
    example: 2,
  })
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  id_movement_aplication: number;

  @ApiPropertyOptional({
    description:
      'UUID del ticket de soporte relacionado (Obligatorio si el destino es por Ticket)',
    example: 'e5b07384-e223-4956-a5e2-bb51263c4511',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  id_ticket?: string;

  @ApiPropertyOptional({
    description: 'UUID del departamento institucional que recibe el insumo',
    example: 'f1b07384-e223-4956-a5e2-bb51263c4522',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  id_departament_consumable?: string;

  @ApiPropertyOptional({
    description:
      'Detalles explicativos adicionales sobre el motivo de la salida o consumo',
    example: 'Entrega de material de papelería complementario para planeación.',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  observations?: string;

  @ApiProperty({
    description:
      'Listado de insumos y cantidades solicitadas en la transacción de salida',
    type: [ConsumableItemDto],
  })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.arrayMinSize'),
  })
  @ValidateNested({ each: true })
  @Type(() => ConsumableItemDto)
  items: ConsumableItemDto[];
}
