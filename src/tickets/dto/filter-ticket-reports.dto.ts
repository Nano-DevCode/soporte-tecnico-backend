import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FilterTicketReportsDto {
  @ApiProperty({
    description: 'ID (UUID) del periodo escolar para filtrar los reportes',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  school_period: string;
}
