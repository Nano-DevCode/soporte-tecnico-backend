import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateTicketInternalFolioDto {
  @ApiProperty({
    description:
      'El nuevo folio interno del ticket (utilizado para las respuestas)',
    example: 'OT-2026-0001-DEP',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  internal_folio: string;
}
