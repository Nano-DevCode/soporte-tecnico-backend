import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateMaintenanceTypeDto {
  @ApiProperty({
    description: 'Nombre del tipo de mantenimiento',
    example: 'Preventivo',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;
}
