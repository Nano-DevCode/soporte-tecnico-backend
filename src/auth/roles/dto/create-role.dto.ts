import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nombre del rol en el sistema',
    example: 'coordinador',
    minLength: 3,
    maxLength: 30,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(3, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(30, { message: i18nValidationMessage('validation.maxLength') })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim()) // Normalización para guards
  name!: string;
}
