import { Module } from '@nestjs/common';
import { ToolsMovementsService } from './tools-movements.service';
import { ToolsMovementsController } from './tools-movements.controller';
import { ToolsMovement } from './entities/tools-movement.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [ToolsMovementsController],
  providers: [ToolsMovementsService],
  imports: [TypeOrmModule.forFeature([ToolsMovement])],
})
export class ToolsMovementsModule {}
