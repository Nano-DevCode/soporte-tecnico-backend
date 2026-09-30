import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateComputingCenterManagerDto {
  @ApiProperty({
    description: 'Nombre(s) del Jefe de Centro de Cómputo',
    example: 'Juan Carlos',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  names: string;

  @ApiProperty({
    description: 'Apellido paterno del Jefe de Centro de Cómputo',
    example: 'Pérez',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  first_last_name: string;

  @ApiProperty({
    description: 'Apellido materno del Jefe de Centro de Cómputo',
    example: 'López',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  second_last_name: string;

  @ApiProperty({
    description:
      'Registro Federal de Contribuyentes (RFC) de la persona física o moral',
    example: 'PELJ800512ABC',
    minLength: 10,
    maxLength: 13,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(13)
  rfc: string;
}
