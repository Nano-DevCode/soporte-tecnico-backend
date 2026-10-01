import { Module } from '@nestjs/common';
import { ItAssetsBrandsService } from './services/it-assets-brands.service';
import { ItAssetsBrandsController } from './controllers/it-assets-brands.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAssetsBrand } from './entities/it-assets-brand.entity';

@Module({
  controllers: [ItAssetsBrandsController],
  providers: [ItAssetsBrandsService],
  imports: [TypeOrmModule.forFeature([ItAssetsBrand])],
  exports: [ItAssetsBrandsService, TypeOrmModule],
})
export class ItAssetsBrandsModule {}
