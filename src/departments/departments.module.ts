import { forwardRef, Module } from '@nestjs/common';
import { DepartmentsService } from './services/departments.service';
import { DepartmentsController } from './controllers/departments.controller';
import { DepartmentSeedService } from './seed/department-seed.service';
import { DepartmentSeedController } from './seed/department-seed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ConsumableMovementsModule } from 'src/consumables/movements/consumable-movements.module';
import { BatchesproductsModule } from 'src/consumables/batches/batchesproducts.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [DepartmentsController, DepartmentSeedController],
  providers: [DepartmentsService, DepartmentSeedService],
  imports: [
    TypeOrmModule.forFeature([Department]),
    forwardRef(() => AuthModule),
    ConsumableMovementsModule,
    BatchesproductsModule,
    CommonModule,
  ],
  exports: [DepartmentsService, DepartmentSeedService, TypeOrmModule],
})
export class DepartmentsModule {}
