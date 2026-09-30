import { Controller, UseFilters } from '@nestjs/common';
import { TypeDocumentsService } from './type-documents.service';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';

@UseFilters(DbexceptionFilter)
@Controller('type-documents')
export class TypeDocumentsController {
  constructor(private readonly typeDocumentsService: TypeDocumentsService) {}
}
