import { PartialType } from '@nestjs/swagger';
import { CreateItAssetsInvoiceDto } from './create-it-assets-invoice.dto';

export class UpdateItAssetsInvoiceDto extends PartialType(
  CreateItAssetsInvoiceDto,
) {}
