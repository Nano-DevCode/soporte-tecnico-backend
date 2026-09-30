import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateItAssetDto {
  @ApiPropertyOptional({
    description: 'Identificador interno asignado al equipo',
    example: 'INV-1002',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Transform(({ value }: TransformFnParams) => {
    if (typeof value !== 'string') return value as string;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  @MaxLength(100, { message: i18nValidationMessage('validation.maxLength') })
  idInventary?: string;

  @ApiProperty({
    description: 'Número de serie único de fábrica',
    example: 'MXL1234567',
    maxLength: 500,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  serialNumber!: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del equipo',
    example: 'Laptop HP ProBook con cargador original',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  description?: string;

  @ApiPropertyOptional({
    description: 'Nombre o denominación del activo',
    example: 'Laptop HP',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @Transform(({ value }: TransformFnParams) => {
    if (typeof value !== 'string') return value as string;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  @MaxLength(100, { message: i18nValidationMessage('validation.maxLength') })
  name?: string;

  @ApiProperty({
    description: 'UUID del modelo del activo',
    example: 'b14421b5-680c-4fa2-8b9a-1c7b80a2b005',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  modelId!: string;

  @ApiProperty({
    description: 'UUID del estado físico/operativo del activo',
    example: 'c3f19114-1e05-4c02-990a-9bc50bc0d099',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  statusId!: string;

  @ApiProperty({
    description: 'UUID del tipo de activo (Ej. Computadora, Monitor)',
    example: 'e5a1b32f-a9b0-4e33-90d1-0a320c2a8c54',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  typeId!: string;

  @ApiPropertyOptional({
    description: 'UUID de la factura asociada a la compra',
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    if (typeof value !== 'string') return value as string;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  invoiceId?: string;

  @ApiPropertyOptional({
    description:
      'Observaciones iniciales (generalmente usadas para generar el primer movimiento)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  observations?: string;
}
