import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateStaffDto {
  @ApiPropertyOptional({
    description: 'Identificador de Telegram para notificaciones',
    example: 'MiUsuarioTelegram',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @MaxLength(20, { message: i18nValidationMessage('validation.maxLength') })
  @IsAlphanumeric('en-US', {
    message: i18nValidationMessage('validation.isAlphanumeric'),
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  idTelegram?: string;

  @ApiProperty({
    description: 'Número de control del empleado',
    example: 'EMP0001',
    maxLength: 20,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(20, { message: i18nValidationMessage('validation.maxLength') })
  @IsAlphanumeric('en-US', {
    message: i18nValidationMessage('validation.isAlphanumeric'),
  })
  @Transform(({ value }: { value: string }) => value?.toUpperCase().trim()) // Normalización institucional
  num_control!: string;

  @ApiProperty({
    description: 'UUID del departamento al que se asigna',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  departmentId!: string;
}
