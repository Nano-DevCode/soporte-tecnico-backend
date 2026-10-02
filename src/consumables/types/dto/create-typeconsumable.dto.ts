import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateTypeconsumableDto {
  @ApiProperty({
    description: 'Denominación o nombre de la categoría del tipo de insumo',
    example: 'Cinta de Impresión',
    minLength: 3,
    maxLength: 500,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(3, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  name: string;
}
