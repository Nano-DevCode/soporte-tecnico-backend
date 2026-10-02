import { PartialType } from '@nestjs/swagger';
import { CreateStoragetypeDto } from './create-storagetype.dto';

export class UpdateStoragetypeDto extends PartialType(CreateStoragetypeDto) {}
