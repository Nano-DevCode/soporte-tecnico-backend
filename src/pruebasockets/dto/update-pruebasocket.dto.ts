import { PartialType } from '@nestjs/mapped-types';
import { CreatePruebasocketDto } from './create-pruebasocket.dto';

export class UpdatePruebasocketDto extends PartialType(CreatePruebasocketDto) {
  id: number;
}
