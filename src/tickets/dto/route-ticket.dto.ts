import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class RouteTicketDto {
  @ApiProperty({
    description:
      'Identificador único del coordinador al que se canaliza el ticket (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  coordinatorId: string;

  @ApiPropertyOptional({
    description:
      'Nivel de prioridad asignado al ticket (de 1 a 4). 1- Crítica, 2- Alta, 3- Media, 4-Baja',
    example: 1,
    minimum: 1,
    maximum: 4,
  })
  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  priority?: number;
}
