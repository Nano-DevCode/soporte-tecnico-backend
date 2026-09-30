import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCoordinationDto {
  @ApiProperty({
    description: 'Nombre descriptivo de la coordinación',
    example: 'Coordinación de Sistemas',
  })
  @IsString()
  name: string;
}
