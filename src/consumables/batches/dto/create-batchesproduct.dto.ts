import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsString,
  IsNumber,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class BatchItemDto {
  @ApiProperty({
    description: 'UUID del consumible que ingresará en este lote',
    example: 'c2b07384-e223-4956-a5e2-bb51263c4577',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  id_consumable: string;

  @ApiProperty({
    description: 'Cantidad bruta recibida en almacén para este consumible',
    example: 15,
  })
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  arrival_amount: number;

  @ApiProperty({
    description:
      'Costo total de este artículo específico en la factura del lote',
    example: 3750.0,
  })
  @IsNumber({}, { message: i18nValidationMessage('validation.isNumber') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  cost_batch: number;
}

export class CreateBatchesproductDto {
  @ApiProperty({
    description:
      'Identificador, folio o clave del requerimiento oficial / requisición de compra',
    example: 'REQ-2026-0412',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  num_requirement: string;

  @ApiProperty({
    description:
      'Arreglo de artículos o consumibles incluidos bajo el mismo requerimiento de entrada',
    type: [BatchItemDto],
  })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ArrayMinSize(1, {
    message: i18nValidationMessage('validation.arrayMinSize'),
  })
  @ValidateNested({ each: true })
  @Type(() => BatchItemDto)
  items: BatchItemDto[];
}
