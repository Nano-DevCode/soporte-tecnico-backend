import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUnitMeasurementDto {
  @ApiProperty({
    description:
      'Nombre completo o estándar de la unidad de medida (Unitario, Fraccionario)',
    example: 'Unitario',
    minLength: 3,
    maxLength: 500,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(3, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  name: string;
}
