import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignTechnicsDto {
  @ApiProperty({
    description:
      'Lista de identificadores únicos (UUIDs) de los técnicos a asignar.',
    type: [String],
    isArray: true,
    minItems: 1,
    maxItems: 4,
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '7b9c1d2e-3f4g-5h6i-7j8k-9l0m1n2o3p4q',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(4)
  @IsUUID('4', { each: true })
  technicianIds: string[];
}
