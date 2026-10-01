import { Module } from '@nestjs/common';
import { ResponsePdfsService } from './response-pdfs.service';
import { ResponsePdfsController } from './response-pdfs.controller';
import { PrinterService } from './services/printer.service';
import { FilesModule } from 'src/files/files.module';

@Module({
  controllers: [ResponsePdfsController],
  providers: [ResponsePdfsService, PrinterService],
  imports: [FilesModule],
  exports: [ResponsePdfsService, PrinterService],
})
export class ResponsePdfsModule {}
