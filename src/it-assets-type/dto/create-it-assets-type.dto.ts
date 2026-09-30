import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateItAssetsTypeDto {
  @ApiProperty({
    description:
      'Nombre del tipo de activo TI. Se guardará normalizado en mayúsculas.',
    example: 'COMPUTADORA DE ESCRITORIO',
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
