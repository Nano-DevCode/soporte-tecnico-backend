import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateFaultValidityDto {
  @ApiProperty({
    description: 'Nombre de la validez de falla',
    example: 'Garantía de Fabricante',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la validez de falla',
    example:
      'Aplica cuando el equipo presenta un defecto de fábrica dentro del primer año.',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description:
      'Indica si esta falla penaliza o afecta el historial del equipo',
    type: Boolean,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  penalizes_equipment?: boolean;
}
