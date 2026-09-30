import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectTicketDto {
  @ApiProperty({
    description: 'Justificación detallada por la cual se rechaza el ticket.',
    example:
      'El problema descrito no es claro, detalle mas el problema presentado.',
  })
  @IsString()
  @IsNotEmpty()
  justification: string;
}
