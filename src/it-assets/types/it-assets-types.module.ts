import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAssetsTypesService } from './services/it-assets-types.service';
import { ItAssetsTypesController } from './controllers/it-assets-types.controller';
import { ItAssetsType } from './entities/it-assets-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItAssetsType])],
  controllers: [ItAssetsTypesController],
  providers: [ItAssetsTypesService],
  exports: [ItAssetsTypesService, TypeOrmModule],
})
export class ItAssetsTypesModule {}
