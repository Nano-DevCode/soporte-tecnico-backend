import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateIssueTypeDto {
  @ApiProperty({
    description: 'Nombre del tipo de incidencia',
    example: 'Hardware',
    minLength: 1,
  })
  @MinLength(1)
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del tipo de incidencia',
    example: 'Problemas relacionados con componentes físicos del equipo',
    minLength: 1,
  })
  @MinLength(1)
  @IsString()
  @IsOptional()
  description?: string;
}
