import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsMovementsController } from './controllers/tools-movements.controller';
import { ToolsMovementsInController } from './controllers/tools-movements-in.controller';
import { ToolsMovementsOutController } from './controllers/tools-movements-out.controller';
import { ToolsMovementsService } from './services/tools-movements.service';
import { ToolsMovementsInService } from './services/tools-movements-in.service';
import { ToolsMovementsOutService } from './services/tools-movements-out.service';
import { ToolsMovement } from './entities/tools-movement.entity';
import { ToolsMovementsIn } from './entities/tools-movements-in.entity';
import { ToolsMovementsOut } from './entities/tools-movements-out.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ToolsMovement,
      ToolsMovementsIn,
      ToolsMovementsOut,
    ]),
  ],
  controllers: [
    ToolsMovementsController,
    ToolsMovementsInController,
    ToolsMovementsOutController,
  ],
  providers: [
    ToolsMovementsService,
    ToolsMovementsInService,
    ToolsMovementsOutService,
  ],
  exports: [
    ToolsMovementsService,
    ToolsMovementsInService,
    ToolsMovementsOutService,
    TypeOrmModule,
  ],
})
export class ToolsMovementsModule {}
