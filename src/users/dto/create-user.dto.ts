import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsUUID,
  IsAlphanumeric,
  Length,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@institucion.edu.mx',
    maxLength: 100,
  })
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(100, { message: i18nValidationMessage('validation.maxLength') })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({
    description: 'Contraseña segura',
    example: 'P4ssw0rdFuerte!',
    minLength: 8,
    maxLength: 50,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MinLength(8, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(50, { message: i18nValidationMessage('validation.maxLength') })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: i18nValidationMessage('validation.isPasswordWeak'),
  })
  password!: string;

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
    description: 'URL del avatar del usuario',
    example: 'https://ejemplo.com/avatar.jpg',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(255, { message: i18nValidationMessage('validation.maxLength') })
  avatar?: string;

  @ApiProperty({
    description: 'ID del rol en el sistema',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  roleId!: string;

  @ApiPropertyOptional({
    description: 'Identificador de Telegram',
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

  @ApiProperty({
    description: 'ID del departamento al que pertenece',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  departmentId!: string;

  @ApiPropertyOptional({
    description: 'ID de la coordinación',
    example: '770e8400-e29b-41d4-a716-446655440111',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  coordinationId?: string;
}
