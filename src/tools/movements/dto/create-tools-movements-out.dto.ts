import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateToolsMovementsOutDto {
  @ApiProperty({
    description:
      'UUID de la herramienta a la que se le aplicará el movimiento de salida',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  toolId!: string;

  @ApiProperty({
    description:
      'UUID del estado físico u operativo en el que sale la herramienta',
    example: 'b14421b5-680c-4fa2-8b9a-1c7b80a2b005',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  toolStatusId!: string;

  @ApiPropertyOptional({
    description:
      'Observaciones o notas adicionales sobre la salida de la herramienta',
    example: 'Falta cable de extensión original.',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  observations?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del motivo de salida',
    example: 'Préstamo temporal para el área de redes.',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  description?: string;

  @ApiPropertyOptional({
    description: 'Folio, vale o documento físico/digital de respaldo',
    example: 'VALE-HER-099',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  voucher?: string;

  @ApiPropertyOptional({
    description: 'UUID del personal (staff) al que se le asigna la herramienta',
    example: 'f8a72b12-9c3a-4a55-89bd-a01234567890',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  staffId?: string;

  @ApiPropertyOptional({
    description: 'UUID del ticket relacionado con esta salida',
    example: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  ticketId?: string;
}
