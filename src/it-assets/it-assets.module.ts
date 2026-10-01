import { Module } from '@nestjs/common';
import { ItAssetsService } from './services/it-assets.service';
import { ItAssetsController } from './controllers/it-assets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAsset } from './entities/it-asset.entity';
import { FilesModule } from 'src/files/files.module';
import { ItAssetsBrandsModule } from './brands/it-assets-brands.module';
import { ItAssetsModelsModule } from './models/it-assets-models.module';
import { ItAssetsStatusModule } from './status/it-assets-status.module';
import { ItAssetsTypesModule } from './types/it-assets-types.module';
import { ItAssetsInvoicesModule } from './invoices/it-assets-invoices.module';
import { ItAssetsMovementsModule } from './movements/it-assets-movements.module';

@Module({
  controllers: [ItAssetsController],
  providers: [ItAssetsService],
  imports: [
    TypeOrmModule.forFeature([ItAsset]),
    FilesModule,
    ItAssetsBrandsModule,
    ItAssetsModelsModule,
    ItAssetsStatusModule,
    ItAssetsTypesModule,
    ItAssetsInvoicesModule,
    ItAssetsMovementsModule,
  ],
  exports: [
    ItAssetsService,
    ItAssetsBrandsModule,
    ItAssetsModelsModule,
    ItAssetsStatusModule,
    ItAssetsTypesModule,
    ItAssetsInvoicesModule,
    ItAssetsMovementsModule,
    TypeOrmModule,
  ],
})
export class ItAssetsModule {}
