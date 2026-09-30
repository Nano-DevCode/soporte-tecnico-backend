import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateStatusDto {
  @ApiProperty({
    description:
      'Código único para identificar el estado (ej. OPEN, IN_PROGRESS).',
    maxLength: 50,
    example: 'IN_PROGRESS',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'Nombre legible del estado.',
    maxLength: 100,
    example: 'En proceso',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
