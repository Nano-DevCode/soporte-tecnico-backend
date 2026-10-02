import { Injectable } from '@nestjs/common';
import { CreateTypeDocumentDto } from './dto/create-type-document.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeDocument } from './entities/type-document.entity';

@Injectable()
export class TypeDocumentsService {
  constructor(
    @InjectRepository(TypeDocument)
    private readonly typeDocumentRepository: Repository<TypeDocument>,
  ) {}
  async create(createTypeDocumentDto: CreateTypeDocumentDto) {
    const typeDocument = this.typeDocumentRepository.create(
      createTypeDocumentDto,
    );
    return await this.typeDocumentRepository.save(typeDocument);
  }

  async deleteAllTypeDocuments() {
    await this.typeDocumentRepository.query(
      'TRUNCATE TABLE "type_document" RESTART IDENTITY CASCADE',
    );
  }
}
