import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class PauseTicketDto {
  @ApiProperty({
    description: 'Diagnóstico técnico que justifica la pausa del ticket.',
    minLength: 10,
    maxLength: 3000,
    example:
      'Se requiere la adquisición de un repuesto no disponible en almacén.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  diagnosis: string;

  @ApiProperty({
    description: 'Justificación detallada por la cual se detiene el proceso.',
    minLength: 10,
    maxLength: 3000,
    example: 'Espera de autorización de compra para refacción externa.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(3000)
  justification: string;
}
