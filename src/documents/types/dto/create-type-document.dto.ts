import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTypeDocumentDto {
  @ApiProperty({
    description: 'Nombre del tipo de documento.',
    minLength: 1,
    example: 'Identificación Oficial',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del tipo de documento.',
    minLength: 1,
    example: 'Documento legal para validar la identidad.',
  })
  @IsString()
  @MinLength(1)
  @IsOptional()
  description?: string;
}
