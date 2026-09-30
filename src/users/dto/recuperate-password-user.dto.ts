import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RecuperatePasswordUserDto {
  @ApiProperty({
    description: 'Correo electrónico para recuperar la contraseña',
    example: 'usuario@institucion.edu.mx',
    maxLength: 100,
  })
  @IsEmail({}, { message: i18nValidationMessage('validation.isEmail') })
  @MaxLength(100, { message: i18nValidationMessage('validation.maxLength') })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;
}
