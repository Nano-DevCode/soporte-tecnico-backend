import { Module } from '@nestjs/common';
import { ConsumableUbicationsService } from './consumable_ubications.service';
import { ConsumableUbicationsController } from './consumable_ubications.controller';
import { ConsumableUbication } from './entities/consumable_ubication.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ConsumableUbication])],
  controllers: [ConsumableUbicationsController],
  providers: [ConsumableUbicationsService],
  exports: [ConsumableUbicationsService, TypeOrmModule],
})
export class ConsumableUbicationsModule {}
