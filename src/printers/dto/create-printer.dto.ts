import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreatePrinterDto {
  @ApiProperty({
    description: 'Identificador UUID del tipo de tecnología de impresión',
    example: '8a4f21b3-46c1-4b11-9231-1823746cd102',
  })
  @IsUUID('4')
  @IsNotEmpty()
  id_type_printing: string;

  @ApiProperty({
    description: 'Identificador UUID del tipo de función operativa del equipo',
    example: 'd3b07384-d113-4956-a5e2-aa51263c4573',
  })
  @IsUUID('4')
  @IsNotEmpty()
  id_type_function: string;

  @ApiPropertyOptional({
    description: 'Define si la impresora soporta impresión a color',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  color: boolean;

  @ApiProperty({
    description:
      'Modelo exacto del cartucho de tinta o tóner que requiere el equipo',
    example: 'HP 58A Black',
  })
  @IsString()
  @IsNotEmpty()
  model_toner: string;
}
