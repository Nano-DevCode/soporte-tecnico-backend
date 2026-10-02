import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateBrandConsumableDto {
  @ApiProperty({
    description: 'Nombre de la marca comercial o fabricante de los insumos',
    example: 'Canon',
    minLength: 2,
    maxLength: 500,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  name: string;
}
