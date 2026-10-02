import { forwardRef, Module } from '@nestjs/common';
import { ConsumableMovementsService } from './consumable-movements.service';
import { ConsumableMovementsController } from './consumable-movements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumableMovement } from './entities/consumable-movement.entity';
import { BatchesproductsModule } from 'src/consumables/batches/batchesproducts.module';
import { MovementAplicationsModule } from 'src/consumables/movements/applications/movement_aplications.module';
import { TicketsModule } from 'src/tickets/tickets.module';
import { DepartmentsModule } from 'src/departments/departments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsumableMovement]),
    BatchesproductsModule,
    MovementAplicationsModule,
    forwardRef(() => TicketsModule),
    forwardRef(() => DepartmentsModule),
  ],
  controllers: [ConsumableMovementsController],
  providers: [ConsumableMovementsService],
  exports: [ConsumableMovementsService, TypeOrmModule],
})
export class ConsumableMovementsModule {}
