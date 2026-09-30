import { forwardRef, Module } from '@nestjs/common';
import { BatchesproductsService } from './batchesproducts.service';
import { BatchesproductsController } from './batchesproducts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batchesproduct } from './entities/batchesproduct.entity';
import { ConsumablesModule } from 'src/consumables/consumables.module';
import { DepartmentsModule } from 'src/departments/departments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Batchesproduct]),
    forwardRef(() => ConsumablesModule),
    forwardRef(() => DepartmentsModule),
  ],
  controllers: [BatchesproductsController],
  providers: [BatchesproductsService],
  exports: [BatchesproductsService, TypeOrmModule],
})
export class BatchesproductsModule {}
