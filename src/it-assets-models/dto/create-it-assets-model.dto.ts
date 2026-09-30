import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateItAssetsModelDto {
  @ApiProperty({
    description: 'Nombre del modelo. Se guardará normalizado en mayúsculas.',
    example: 'OPTIPLEX 3090',
    minLength: 2,
    maxLength: 80,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(80, { message: i18nValidationMessage('validation.maxLength') })
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  name!: string;

  @ApiProperty({
    description: 'UUID de la marca a la que pertenece el modelo',
    example: 'b14421b5-680c-4fa2-8b9a-1c7b80a2b005',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  brandId!: string;
}
