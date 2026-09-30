import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateToolsMovementsInDto {
  @ApiProperty({
    description:
      'UUID de la herramienta a la que se le aplicará el movimiento de entrada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  toolId!: string;

  @ApiProperty({
    description:
      'UUID del estado físico u operativo en el que entra la herramienta',
    example: 'b14421b5-680c-4fa2-8b9a-1c7b80a2b005',
  })
  @IsUUID('4', { message: i18nValidationMessage('validation.isUuid') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.isNotEmpty') })
  toolsStatusId!: string;

  @ApiPropertyOptional({
    description: 'Observaciones o notas adicionales sobre la entrada',
    example: 'Ingresa a almacén por fin de turno.',
  })
  @IsString({ message: i18nValidationMessage('validation.isString') })
  @IsOptional()
  observations?: string;
}
