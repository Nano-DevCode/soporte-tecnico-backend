import { PartialType } from '@nestjs/swagger';
import { CreateModelDto } from './create-model.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateModelDto extends PartialType(CreateModelDto) {
  @IsOptional()
  @IsUUID('all', { message: 'El ID de la marca debe ser un UUID válido' })
  id_brand?: string;
}
