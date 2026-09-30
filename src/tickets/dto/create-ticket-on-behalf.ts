import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateTicketDto } from './create-ticket.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketOnBehalfDto extends CreateTicketDto {
  @ApiProperty({
    description:
      'Identificador único del usuario por el cual se crea el ticket (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
