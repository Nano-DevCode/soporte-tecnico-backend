import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class UpdateResponseDto {
  @ApiPropertyOptional({
    description: 'Diagnóstico técnico actualizado',
    example:
      'Se detectó una falla en el módulo de memoria RAM debido a picos de voltaje.',
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
    description: 'Descripción del trabajo realizado actualizado',
    example:
      'Se reemplazó el módulo de RAM defectuoso y se realizó limpieza de slots.',
    minLength: 10,
    maxLength: 3000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  @IsOptional()
  work_done: string;

  @ApiPropertyOptional({
    description: 'ID (UUID) del nuevo tipo de mantenimiento',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  maintenance_type_id: string;

  @ApiPropertyOptional({
    description: 'ID (UUID) del nuevo tipo de servicio',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  service_type_id: string;
}
