import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsArray,
  ArrayUnique,
} from 'class-validator';

export class CreateTechnicalReportDto {
  @ApiProperty({
    description: 'Diagnóstico técnico detallado de la incidencia',
    example:
      'El equipo presenta errores de lectura en el disco duro principal.',
    minLength: 10,
    maxLength: 3000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  diagnosis: string;

  @ApiProperty({
    description:
      'Descripción detallada del trabajo realizado para la reparación',
    example: 'Se realizó el reemplazo del disco duro y la migración de datos.',
    minLength: 10,
    maxLength: 3000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  work_performed: string;

  @ApiPropertyOptional({
    description: 'Lista de otros materiales utilizados durante el servicio',
    example: 'Disco duro SSD 500GB, cable SATA.',
    minLength: 3,
    maxLength: 3000,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(3000)
  materials_used?: string;

  @ApiProperty({
    description: 'Indica si la incidencia fue resuelta',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  is_resolved: boolean;

  @ApiProperty({
    description: 'ID (UUID) del ticket asociado al informe técnico',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  ticketId: string;

  @ApiPropertyOptional({
    description: 'Lista de IDs (UUID) de los equipos intervenidos',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  equipment_ids?: string[];

  @ApiProperty({
    description:
      'ID (UUID) correspondiente a la naturaleza de la falla detectada',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsNotEmpty()
  @IsUUID()
  fault_validity_id: string;
}
