import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
  IsArray,
  ArrayUnique,
} from 'class-validator';

export class UpdateTechnicalReportDto {
  @ApiPropertyOptional({
    description: 'Diagnóstico técnico actualizado',
    example: 'El disco duro ha sido diagnosticado con sectores defectuosos.',
    minLength: 10,
    maxLength: 3000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  @IsOptional()
  diagnosis: string;

  @ApiPropertyOptional({
    description: 'Descripción actualizada del trabajo realizado',
    example: 'Se realizó el reemplazo preventivo del componente.',
    minLength: 10,
    maxLength: 3000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  @IsOptional()
  work_performed: string;

  @ApiPropertyOptional({
    description: 'Lista actualizada de materiales utilizados',
    example: 'Pasta térmica, ventilador de reemplazo.',
    minLength: 3,
    maxLength: 3000,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(3000)
  @IsOptional()
  materials_used: string;

  @ApiPropertyOptional({
    description: 'Lista actualizada de IDs (UUID) de equipos',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  equipment_ids?: string[];

  @ApiPropertyOptional({
    description: 'Nuevo ID (UUID) de la validez de la falla',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsNotEmpty()
  @IsUUID()
  @IsOptional()
  fault_validity_id: string;
}
