import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateToolsStatusDto {
  @ApiProperty({
    description: 'Nombre del estado. Se guardará normalizado en mayúsculas.',
    example: 'EN REPARACIÓN',
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
    description:
      'Descripción que detalla los criterios para asignar este estado',
    example:
      'Herramienta que requiere intervención técnica antes de ser reasignada.',
    maxLength: 500,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  @Transform(({ value }: { value: string }) => value?.trim())
  description!: string;
}
