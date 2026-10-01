import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO que contiene exclusivamente la información personal y laboral del empleado (Staff).
 * Maneja datos de identidad institucional, nombres, RFC, adscripción departamental y coordinación.
 */
export class CreateStaffProfileDto {
  @ApiProperty({
    description: 'Nombre(s) del usuario',
    example: 'Juan',
    maxLength: 50,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(50, { message: i18nValidationMessage('validation.maxLength') })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: i18nValidationMessage('validation.onlyLetters'),
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiProperty({
    description: 'Apellido paterno',
    example: 'Pérez',
    maxLength: 50,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(50, { message: i18nValidationMessage('validation.maxLength') })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: i18nValidationMessage('validation.onlyLetters'),
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  paternalSurname!: string;

  @ApiProperty({
    description: 'Apellido materno',
    example: 'González',
    maxLength: 50,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(50, { message: i18nValidationMessage('validation.maxLength') })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: i18nValidationMessage('validation.onlyLetters'),
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  maternalSurname!: string;

  @ApiPropertyOptional({
    description: 'Identificador de Telegram para notificaciones',
    example: 'MiUsuarioTelegram',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(20, { message: i18nValidationMessage('validation.maxLength') })
  @IsAlphanumeric('en-US', {
    message: i18nValidationMessage('validation.isAlphanumeric'),
  })
  idTelegram?: string;

  @ApiProperty({
    description: 'Número de control asignado',
    example: 'EMP0001',
    maxLength: 20,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(20, { message: i18nValidationMessage('validation.maxLength') })
  @IsAlphanumeric('en-US', {
    message: i18nValidationMessage('validation.isAlphanumeric'),
  })
  @Transform(({ value }: { value: string }) => value?.toUpperCase().trim())
  num_control!: string;

  @ApiProperty({
    description: 'RFC del usuario',
    example: 'XAXX010101000',
    minLength: 13,
    maxLength: 13,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @Length(13, 13, { message: i18nValidationMessage('validation.length') })
  @Matches(/^[A-Z0-9]+$/, {
    message: i18nValidationMessage('validation.isRfcInvalid'),
  })
  @Transform(({ value }: { value: string }) => value?.toUpperCase().trim())
  rfc!: string;

  @ApiPropertyOptional({
    description: 'ID de la coordinación asignada (requerido si es coordinador)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  coordinationId?: string;

  @ApiPropertyOptional({
    description: 'ID del departamento al que pertenece',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  departmentId?: string;
}
