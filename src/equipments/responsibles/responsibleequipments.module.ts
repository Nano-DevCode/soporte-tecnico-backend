import { Module } from '@nestjs/common';
import { ResponsibleequipmentsService } from './responsibleequipments.service';
import { ResponsibleequipmentsController } from './responsibleequipments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Responsibleequipment } from './entities/responsibleequipment.entity';
@Module({
  controllers: [ResponsibleequipmentsController],
  providers: [ResponsibleequipmentsService],
  imports: [TypeOrmModule.forFeature([Responsibleequipment])],
})
export class ResponsibleequipmentsModule {}
