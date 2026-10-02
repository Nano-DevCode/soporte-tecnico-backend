import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateComputerequipmenttypeDto {
  @ApiProperty({
    description:
      'Nombre de la categoría o clasificación física del equipo de cómputo',
    example: 'PC de Escritorio',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(200, { message: i18nValidationMessage('validation.maxLength') })
  name: string;
}
