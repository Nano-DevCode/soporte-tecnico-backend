import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateRejectionReportDto {
  @ApiProperty({
    description: 'Justificación detallada del rechazo del ticket',
    example:
      'El ticket no cuenta con la información técnica necesaria para proceder.',
  })
  @IsString()
  @IsNotEmpty()
  justification: string;

  @ApiProperty({
    description: 'ID (UUID) del ticket que está siendo rechazado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  ticketId: string;
}
