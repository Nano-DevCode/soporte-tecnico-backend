import { Module } from '@nestjs/common';
import { TypeDocumentsService } from './type-documents.service';
import { TypeDocumentsController } from './type-documents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeDocument } from './entities/type-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TypeDocument])],
  controllers: [TypeDocumentsController],
  providers: [TypeDocumentsService],
  exports: [TypeDocumentsService],
})
export class TypeDocumentsModule {}
