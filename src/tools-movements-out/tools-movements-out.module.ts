import { Module } from '@nestjs/common';
import { ToolsMovementsOutService } from './tools-movements-out.service';
import { ToolsMovementsOutController } from './tools-movements-out.controller';
import { ToolsMovementsOut } from './entities/tools-movements-out.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [ToolsMovementsOutController],
  providers: [ToolsMovementsOutService],
  imports: [TypeOrmModule.forFeature([ToolsMovementsOut])],
})
export class ToolsMovementsOutModule {}
