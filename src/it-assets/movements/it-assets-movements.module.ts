import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAssetsMovementsController } from './controllers/it-assets-movements.controller';
import { ItAssetsMovementsInController } from './controllers/it-assets-movements-in.controller';
import { ItAssetsMovementsOutController } from './controllers/it-assets-movements-out.controller';
import { ItAssetsMovementsService } from './services/it-assets-movements.service';
import { ItAssetsMovementsInService } from './services/it-assets-movements-in.service';
import { ItAssetsMovementsOutService } from './services/it-assets-movements-out.service';
import { ItAssetsMovement } from './entities/it-assets-movement.entity';
import { ItAssetsMovementsIn } from './entities/it-assets-movements-in.entity';
import { ItAssetsMovementsOut } from './entities/it-assets-movements-out.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ItAssetsMovement,
      ItAssetsMovementsIn,
      ItAssetsMovementsOut,
    ]),
  ],
  controllers: [
    ItAssetsMovementsController,
    ItAssetsMovementsInController,
    ItAssetsMovementsOutController,
  ],
  providers: [
    ItAssetsMovementsService,
    ItAssetsMovementsInService,
    ItAssetsMovementsOutService,
  ],
  exports: [
    ItAssetsMovementsService,
    ItAssetsMovementsInService,
    ItAssetsMovementsOutService,
    TypeOrmModule,
  ],
})
export class ItAssetsMovementsModule {}
