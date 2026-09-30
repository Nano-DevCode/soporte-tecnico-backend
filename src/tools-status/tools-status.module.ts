import { Module } from '@nestjs/common';
import { ToolsStatusService } from './tools-status.service';
import { ToolsStatusController } from './tools-status.controller';
import { ToolsStatus } from './entities/tools-status.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [ToolsStatusController],
  providers: [ToolsStatusService],
  imports: [TypeOrmModule.forFeature([ToolsStatus])],
})
export class ToolsStatusModule {}
