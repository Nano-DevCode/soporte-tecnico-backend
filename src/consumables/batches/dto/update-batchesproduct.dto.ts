import { PartialType } from '@nestjs/swagger';
import { CreateBatchesproductDto } from './create-batchesproduct.dto';

export class UpdateBatchesproductDto extends PartialType(
  CreateBatchesproductDto,
) {}
