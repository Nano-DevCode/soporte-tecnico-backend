import { Module } from '@nestjs/common';
import { BrandConsumablesService } from './brand-consumables.service';
import { BrandConsumablesController } from './brand-consumables.controller';
import { BrandConsumable } from './entities/brand-consumable.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([BrandConsumable])], // <-- Esto mapea la entidad al pool
  controllers: [BrandConsumablesController],
  providers: [BrandConsumablesService],
  exports: [BrandConsumablesService, TypeOrmModule],
})
export class BrandConsumablesModule {}
