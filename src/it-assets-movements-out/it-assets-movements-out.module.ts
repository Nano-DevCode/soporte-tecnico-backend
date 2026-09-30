import { Module } from '@nestjs/common';
import { ItAssetsMovementsOutService } from './it-assets-movements-out.service';
import { ItAssetsMovementsOutController } from './it-assets-movements-out.controller';
import { ItAssetsMovementsOut } from './entities/it-assets-movements-out.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [ItAssetsMovementsOutController],
  providers: [ItAssetsMovementsOutService],
  imports: [TypeOrmModule.forFeature([ItAssetsMovementsOut])],
})
export class ItAssetsMovementsOutModule {}
