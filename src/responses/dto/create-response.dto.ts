import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateResponseDto {
  @ApiProperty({
    description: 'Diagnóstico técnico detallado sobre el problema encontrado',
    example:
      'Se detectó una falla en el módulo de memoria RAM debido a picos de voltaje.',
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
      'Descripción del trabajo realizado para solucionar el problema',
    example:
      'Se reemplazó el módulo de RAM defectuoso y se realizó limpieza de slots.',
    minLength: 10,
    maxLength: 3000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  work_done: string;

  @ApiProperty({
    description: 'ID (UUID) del ticket asociado a esta respuesta',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  ticket_id: string;

  @ApiProperty({
    description: 'ID (UUID) del tipo de mantenimiento realizado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  maintenance_type_id: string;

  @ApiProperty({
    description: 'ID (UUID) del tipo de servicio aplicado',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsUUID()
  @IsNotEmpty()
  service_type_id: string;
}
