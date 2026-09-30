import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsUrl,
  IsOptional,
  MinLength,
  IsPositive,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Descripción detallada del problema reportado.',
    minLength: 5,
    maxLength: 2000,
    example: 'El equipo no enciende y emite un pitido constante.',
  })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Nombre del usuario afectado.',
    minLength: 5,
    maxLength: 250,
    example: 'Juan Pérez García',
  })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(250)
  affected_name: string;

  @IsUrl()
  @IsOptional()
  evidence_url?: string;

  @ApiProperty({
    description: 'Correo electrónico de contacto del usuario.',
    example: 'usuario@empresa.com',
  })
  @IsEmail()
  contact_email: string;

  @ApiProperty({
    description: 'Horario disponible para realizar el mantenimiento.',
    minLength: 5,
    example: 'Lunes a Viernes de 09:00 a 14:00',
  })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  available_hours: string;

  @ApiProperty({
    description: 'Ubicación física del equipo reportado.',
    minLength: 5,
    example: 'Edificio de sistemas, Laboratorio 2',
  })
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  equipment_location: string;

  @ApiProperty({
    description: 'Identificador del tipo de problema.',
    example: 1,
  })
  @IsPositive()
  issue_type: number;
}
