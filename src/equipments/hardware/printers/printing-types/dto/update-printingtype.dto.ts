import { PartialType } from '@nestjs/swagger';
import { CreatePrintingtypeDto } from './create-printingtype.dto';

export class UpdatePrintingtypeDto extends PartialType(CreatePrintingtypeDto) {}
