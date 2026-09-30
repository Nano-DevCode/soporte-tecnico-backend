import { PartialType } from '@nestjs/swagger';
import { CreateTypenetworkDto } from './create-typenetwork.dto';
export class UpdateTypenetworkDto extends PartialType(CreateTypenetworkDto) {}
