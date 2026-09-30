import { Module } from '@nestjs/common';
import { ResponsePdfsService } from './response-pdfs.service';
import { ResponsePdfsController } from './response-pdfs.controller';
import { PrinterModule } from 'src/printer/printer.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  controllers: [ResponsePdfsController],
  providers: [ResponsePdfsService],
  imports: [PrinterModule, FilesModule],
  exports: [ResponsePdfsService],
})
export class ResponsePdfsModule {}
