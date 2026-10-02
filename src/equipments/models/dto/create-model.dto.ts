import { ApiProperty } from '@nestjs/swagger';
import {
  MinLength,
  IsString,
  IsUUID,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateModelDto {
  @ApiProperty({
    description: 'Nombre comercial o denominación de la línea del modelo',
    example: 'LaserJet Pro M404dn',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(200, { message: i18nValidationMessage('validation.maxLength') })
  name: string;

  @ApiProperty({
    description:
      'Identificador único UUID de la marca a la que pertenece el modelo',
    example: 'f8c3d81b-96c2-4d11-8231-1823746de552',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isDefined') })
  id_brand: string;
}
