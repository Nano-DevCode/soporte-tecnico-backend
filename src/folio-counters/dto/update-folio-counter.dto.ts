import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class UpdateFolioCounterDto {
  @ApiProperty({
    description:
      'El nuevo número de folio que se asignará al siguiente registro',
    example: 150,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  requestedNextFolio: number;
}
