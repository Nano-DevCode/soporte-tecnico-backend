import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateItAssetsInvoiceDto {
  @ApiProperty({
    description:
      'Folio o número interno de la factura. Se guardará normalizado en mayúsculas.',
    example: 'FAC-8899',
    minLength: 2,
    maxLength: 80,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(2, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(80, { message: i18nValidationMessage('validation.maxLength') })
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  idInternal!: string;
}
