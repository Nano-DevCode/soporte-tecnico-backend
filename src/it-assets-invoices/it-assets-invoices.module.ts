import { Module } from '@nestjs/common';
import { ItAssetsInvoicesService } from './it-assets-invoices.service';
import { ItAssetsInvoicesController } from './it-assets-invoices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItAssetsInvoice } from './entities/it-assets-invoice.entity';

@Module({
  controllers: [ItAssetsInvoicesController],
  providers: [ItAssetsInvoicesService],
  imports: [TypeOrmModule.forFeature([ItAssetsInvoice])],
})
export class ItAssetsInvoicesModule {}
