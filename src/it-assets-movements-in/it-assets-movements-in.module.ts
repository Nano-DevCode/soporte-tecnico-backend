import { Module } from '@nestjs/common';
import { ItAssetsMovementsInService } from './it-assets-movements-in.service';
import { ItAssetsMovementsInController } from './it-assets-movements-in.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAssetsMovementsIn } from './entities/it-assets-movements-in.entity';

@Module({
  controllers: [ItAssetsMovementsInController],
  providers: [ItAssetsMovementsInService],
  imports: [TypeOrmModule.forFeature([ItAssetsMovementsIn])],
})
export class ItAssetsMovementsInModule {}
