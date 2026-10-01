import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * DTO que contiene exclusivamente los datos de la cuenta de acceso (User).
 * Maneja credenciales, rol y avatar del usuario.
 */
export class CreateAccountDto {
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
}
