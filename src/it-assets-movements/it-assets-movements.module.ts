import { Module } from '@nestjs/common';
import { ItAssetsMovementsService } from './it-assets-movements.service';
import { ItAssetsMovementsController } from './it-assets-movements.controller';
import { ItAssetsMovement } from './entities/it-assets-movement.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [ItAssetsMovementsController],
  providers: [ItAssetsMovementsService],
  imports: [TypeOrmModule.forFeature([ItAssetsMovement])],
})
export class ItAssetsMovementsModule {}
