import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';
import { Equipment } from './entities/equipment.entity';
import { ComputersModule } from 'src/computers/computers.module';
import { PrintersModule } from 'src/printers/printers.module';
import { NetworksModule } from 'src/networks/networks.module';
import { EquipmenttypesModule } from 'src/equipmenttypes/equipmenttypes.module';
import { DepartmentsModule } from 'src/departments/departments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment]),
    ComputersModule,
    PrintersModule,
    NetworksModule,
    EquipmenttypesModule,
    DepartmentsModule,
  ],
  controllers: [EquipmentsController],
  providers: [EquipmentsService],
  exports: [EquipmentsService, TypeOrmModule],
})
export class EquipmentsModule {}
