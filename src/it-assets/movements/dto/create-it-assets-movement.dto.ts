import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItAssetsMovementDto {
  @ApiPropertyOptional({
    description: 'DTO base para registros de movimientos de activos TI',
  })
  description?: string;
}
