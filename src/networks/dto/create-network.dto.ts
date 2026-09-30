import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateNetworkDto {
  @ApiProperty({
    description:
      'Identificador UUID del tipo de equipo de red (procedente del catálogo Typenetwork)',
    example: 'c4a81b4f-96c2-4d11-8231-1823746de714',
  })
  @IsUUID('4')
  @IsNotEmpty()
  id_type_equipment_network: string;

  @ApiProperty({
    description:
      'Número de interfaces o puertos ethernet disponibles en el hardware',
    example: 48,
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  number_ports: number;

  @ApiPropertyOptional({
    description:
      'Establece si el switch o router provee alimentación PoE a sus puertos',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  PoE: boolean = false;
}
