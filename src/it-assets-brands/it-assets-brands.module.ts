import { Module } from '@nestjs/common';
import { ItAssetsBrandsService } from './it-assets-brands.service';
import { ItAssetsBrandsController } from './it-assets-brands.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAssetsBrand } from './entities/it-assets-brand.entity';

@Module({
  controllers: [ItAssetsBrandsController],
  providers: [ItAssetsBrandsService],
  imports: [TypeOrmModule.forFeature([ItAssetsBrand])],
})
export class ItAssetsBrandsModule {}
