import { PartialType } from '@nestjs/swagger';
import { CreateToolsInvoiceDto } from './create-tools-invoice.dto';

export class UpdateToolsInvoiceDto extends PartialType(CreateToolsInvoiceDto) {}
