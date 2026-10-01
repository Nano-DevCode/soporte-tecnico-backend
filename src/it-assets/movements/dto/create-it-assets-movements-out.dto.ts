import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateItAssetsMovementsOutDto {
  @ApiProperty({
    description:
      'UUID del activo TI al que se le aplicará el movimiento de salida',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  itAssetId!: string;

  @ApiProperty({
    description: 'UUID del estado físico u operativo en el que sale el activo',
    example: 'b14421b5-680c-4fa2-8b9a-1c7b80a2b005',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  itAssetsStatusId!: string;

  @ApiPropertyOptional({
    description: 'Observaciones o notas adicionales sobre la salida del equipo',
    example: 'Se entrega equipo formateado y con paquetería base.',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  observations?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del motivo de salida',
    example: 'Asignación temporal para cubrir guardia.',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  description?: string;

  @ApiPropertyOptional({
    description: 'Folio, vale o documento físico/digital de respaldo',
    example: 'VALE-2026-015',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.isString') })
  voucher?: string;

  @ApiPropertyOptional({
    description: 'UUID del personal (staff) al que se le asigna el equipo',
    example: 'f8a72b12-9c3a-4a55-89bd-a01234567890',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  staffId?: string;

  @ApiPropertyOptional({
    description:
      'UUID del ticket de soporte técnico relacionado con esta salida',
    example: 'a1b2c3d4-e5f6-4a5b-8c9d-0123456789ab',
  })
  @IsOptional()
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  ticketId?: string;
}
