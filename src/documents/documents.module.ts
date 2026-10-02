import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { TypeDocumentsModule } from './types/type-documents.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document]), TypeDocumentsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService, TypeDocumentsModule],
})
export class DocumentsModule {}
