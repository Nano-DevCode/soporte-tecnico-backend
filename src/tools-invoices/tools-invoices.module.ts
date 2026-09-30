import { Module } from '@nestjs/common';
import { ToolsInvoicesService } from './tools-invoices.service';
import { ToolsInvoicesController } from './tools-invoices.controller';
import { ToolsInvoice } from './entities/tools-invoice.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [ToolsInvoicesController],
  providers: [ToolsInvoicesService],
  imports: [TypeOrmModule.forFeature([ToolsInvoice])],
})
export class ToolsInvoicesModule {}
