import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateItAssetsMovementsInDto {
  @ApiProperty({
    description:
      'UUID del activo TI al que se le aplicará el movimiento de entrada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  itAssetId!: string;

  @ApiProperty({
    description:
      'UUID del nuevo estado físico u operativo en el que entra el activo',
    example: 'b14421b5-680c-4fa2-8b9a-1c7b80a2b005',
  })
  @IsUUID('4')
  @IsNotEmpty()
  itAssetsStatusId!: string;

  @ApiPropertyOptional({
    description:
      'Observaciones o notas adicionales sobre el estado o motivo de la entrada',
    example: 'El equipo regresa de reparación de pantalla.',
  })
  @IsString()
  @IsOptional()
  observations?: string;
}
