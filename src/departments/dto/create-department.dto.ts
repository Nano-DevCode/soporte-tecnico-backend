import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Nombre completo del departamento',
    example: 'Centro de Cómputo',
    maxLength: 100,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(100, { message: i18nValidationMessage('validation.maxLength') })
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiProperty({
    description: 'Nivel de prioridad del departamento (1 al 4)',
    example: 1,
    minimum: 1,
    maximum: 4,
  })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  @Max(4, { message: i18nValidationMessage('validation.max') })
  priority!: number;

  @ApiPropertyOptional({
    description: 'Estado inicial del departamento',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as boolean;
  })
  @IsBoolean({ message: i18nValidationMessage('validation.isBoolean') })
  status?: boolean = true;

  @ApiProperty({
    description: 'Acrónimo o siglas institucionales del departamento',
    example: 'CC',
    maxLength: 10,
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MaxLength(10, { message: i18nValidationMessage('validation.maxLength') })
  @Transform(({ value }: { value: string }) => value?.toUpperCase().trim()) // Normalización (ej: "SIST" -> "SIST")
  acronym!: string;
}
