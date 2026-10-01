import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateToolsTypeDto {
  @ApiProperty({
    description:
      'Nombre del tipo de herramienta. Se guardará normalizado en mayúsculas.',
    example: 'HERRAMIENTA MANUAL',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(3, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(50, { message: i18nValidationMessage('validation.maxLength') })
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  name!: string;
}
