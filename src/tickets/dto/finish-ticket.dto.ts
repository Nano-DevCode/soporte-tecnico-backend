import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class FinishTicketDto {
  @ApiProperty({
    description: 'Diagnóstico técnico realizado.',
    minLength: 10,
    maxLength: 3000,
    example: 'Se identificó un fallo en el módulo de memoria RAM.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  diagnosis: string;

  @ApiProperty({
    description: 'Descripción detallada del trabajo realizado.',
    minLength: 10,
    maxLength: 3000,
    example:
      'Se procedió al cambio del módulo de memoria y verificación del sistema.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  work_done: string;

  @ApiProperty({
    description:
      'Identificador único del tipo de mantenimiento realizado (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  maintenance_type_id: string;

  @ApiProperty({
    description:
      'Identificador único del tipo de servicio proporcionado (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  service_type_id: string;
}
