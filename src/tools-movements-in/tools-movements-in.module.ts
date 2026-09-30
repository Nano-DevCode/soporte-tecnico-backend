import { Module } from '@nestjs/common';
import { ToolsMovementsInService } from './tools-movements-in.service';
import { ToolsMovementsInController } from './tools-movements-in.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsMovementsIn } from './entities/tools-movements-in.entity';

@Module({
  controllers: [ToolsMovementsInController],
  providers: [ToolsMovementsInService],
  imports: [TypeOrmModule.forFeature([ToolsMovementsIn])],
})
export class ToolsMovementsInModule {}
