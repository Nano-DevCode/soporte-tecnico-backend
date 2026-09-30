import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsUUID, Min } from 'class-validator';

export class CreateTicketHistoryDto {
  @ApiPropertyOptional({
    description: 'Duración en la que el ticket permaneció en este estado.',
    example: 3600,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duracion: number;

  @ApiProperty({
    description: 'Identificador único del ticket relacionado (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID(4)
  ticketId: string;

  @ApiProperty({
    description: 'Identificador único del estado a asignar.',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  statusId: number;
}
