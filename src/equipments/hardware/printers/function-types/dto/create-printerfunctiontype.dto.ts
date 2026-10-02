import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreatePrinterfunctiontypeDto {
  @ApiProperty({
    description: 'Nombre de la modalidad o función operativa de la impresora',
    example: 'Solo Impresión / Monofuncional',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(200, { message: i18nValidationMessage('validation.maxLength') })
  name: string;
}
