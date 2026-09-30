import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateComputerDto {
  @ApiProperty({
    description:
      'Identificador UUID del tipo o factor de forma de la computadora',
    example: '5a2e81b4-96c2-4d11-8231-1823746de509',
  })
  @IsUUID('4')
  @IsNotEmpty()
  id_type_equipment_computer: string;

  @ApiProperty({
    description: 'Identificador UUID de la tecnología de disco (SSD/HDD)',
    example: '7c3d81b4-96c2-4d11-8231-1823746de612',
  })
  @IsUUID('4')
  @IsNotEmpty()
  id_type_storage: string;

  @ApiProperty({
    description: 'Identificador UUID del sistema operativo base instalado',
    example: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID('4')
  @IsNotEmpty()
  id_type_operating_system: string;

  @ApiProperty({
    description: 'Identificador UUID del procesador (CPU) asignado',
    example: 'd9b07384-e223-4956-a5e2-bb51263c4581',
  })
  @IsUUID('4')
  @IsNotEmpty()
  id_processor: string;

  @ApiProperty({
    description: 'Detalle de la capacidad y velocidad de la memoria RAM',
    example: '8 GB DDR4',
  })
  @IsString()
  @IsNotEmpty()
  ram: string;

  @ApiProperty({
    description: 'Capacidad total de almacenamiento configurada',
    example: '1 TB',
  })
  @IsString()
  @IsNotEmpty()
  capacity_storage: string;

  @ApiProperty({
    description: 'Espacio de almacenamiento libre inicial reportado',
    example: '930 GB',
  })
  @IsString()
  @IsNotEmpty()
  available_storage: string;
}
