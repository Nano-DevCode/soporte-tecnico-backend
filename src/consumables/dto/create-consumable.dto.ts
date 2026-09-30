import {
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateConsumableDto {
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(3, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  name: string;

  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @MinLength(3, { message: i18nValidationMessage('validation.minLength') })
  @MaxLength(500, { message: i18nValidationMessage('validation.maxLength') })
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  stockMin: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  stockMax: number;

  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  id_type_consumable: number;

  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  id_unit_measurement: number;

  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  id_brand_consumable: string;

  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  id_ubication_consumable: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.isInt') })
  @IsPositive({ message: i18nValidationMessage('validation.isPositive') })
  number_uses?: number;
}
