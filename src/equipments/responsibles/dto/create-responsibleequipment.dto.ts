import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateResponsibleequipmentDto {
  @ApiProperty({
    description: 'Clave o número identificador único de control del trabajador',
    example: 'EMP12345',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(200, { message: i18nValidationMessage('validation.maxLength') })
  num_employe: string;

  @ApiProperty({
    description: 'Nombre o nombres de pila de la persona',
    example: 'Juan Carlos',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(200, { message: i18nValidationMessage('validation.maxLength') })
  name: string;

  @ApiProperty({
    description: 'Primer apellido (Paterno)',
    example: 'Lopez',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(200, { message: i18nValidationMessage('validation.maxLength') })
  first_name: string;

  @ApiProperty({
    description: 'Segundo apellido (Materno)',
    example: 'Cruz',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(200, { message: i18nValidationMessage('validation.maxLength') })
  last_name: string;

  @ApiProperty({
    description: 'Departamento, división o área de adscripción institucional',
    example: 'Área de Secretarias',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(200, { message: i18nValidationMessage('validation.maxLength') })
  area: string;

  @ApiProperty({
    description: 'Dirección de correo electrónico institucional de contacto',
    example: 'juan.perez@empresa.com',
  })
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  mail: string;
}
