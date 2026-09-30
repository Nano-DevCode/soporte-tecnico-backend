import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateServiceTypeDto {
  @ApiProperty({
    description: 'Nombre del tipo de servicio',
    example: 'Mantenimiento Correctivo',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;
}
