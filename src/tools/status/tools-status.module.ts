import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolsStatusService } from './services/tools-status.service';
import { ToolsStatusController } from './controllers/tools-status.controller';
import { ToolsStatus } from './entities/tools-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ToolsStatus])],
  controllers: [ToolsStatusController],
  providers: [ToolsStatusService],
  exports: [ToolsStatusService, TypeOrmModule],
})
export class ToolsStatusModule {}
