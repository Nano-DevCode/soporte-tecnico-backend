import { Module } from '@nestjs/common';
import { FilesModule } from 'src/files/files.module';
import { PrinterService } from './services/printer.service';
import { PdfsService, ResponsePdfsService } from './services/pdfs.service';
import { PdfsController, ResponsePdfsController } from './controllers/pdfs.controller';

@Module({
  imports: [FilesModule],
  controllers: [PdfsController],
  providers: [PrinterService, PdfsService],
  exports: [PrinterService, PdfsService],
})
export class PdfsModule {}

// Alias para garantizar compatibilidad retroactiva completa
export { PdfsModule as ResponsePdfsModule, ResponsePdfsService, ResponsePdfsController };
