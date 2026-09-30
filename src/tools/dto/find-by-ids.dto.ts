import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FindByIdsDto {
  @ApiProperty({
    description: 'Arreglo de UUIDs de las herramientas',
    type: [String],
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '987e6543-e21b-34d5-c678-426614174111',
    ],
  })
  @IsArray({ message: i18nValidationMessage('validation.isArray') })
  @ArrayNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsUUID('4', {
    each: true,
    message: i18nValidationMessage('validation.isUuid'),
  })
  ids!: string[];
}
