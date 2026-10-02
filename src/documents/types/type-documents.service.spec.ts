import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TypeDocumentsService } from './type-documents.service';
import { TypeDocument } from './entities/type-document.entity';
import { CreateTypeDocumentDto } from './dto/create-type-document.dto';

describe('TypeDocumentsService', () => {
  let service: TypeDocumentsService;

  const mockTypeDocument: TypeDocument = {
    id: 1,
    name: 'Orden de servicio',
    description: 'Documento técnico de servicio',
    created_at: new Date(),
    updated_at: new Date(),
    documents: [],
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeDocumentsService,
        {
          provide: getRepositoryToken(TypeDocument),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<TypeDocumentsService>(TypeDocumentsService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y guardar un tipo de documento', async () => {
      const dto: CreateTypeDocumentDto = {
        name: 'Orden de servicio',
        description: 'Documento técnico de servicio',
      };

      mockRepo.create.mockReturnValue(mockTypeDocument);
      mockRepo.save.mockResolvedValue(mockTypeDocument);

      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(mockTypeDocument);
      expect(result).toEqual(mockTypeDocument);
    });
  });

  describe('deleteAllTypeDocuments', () => {
    it('debe ejecutar query de truncate con cascada', async () => {
      mockRepo.query.mockResolvedValue(undefined);

      await service.deleteAllTypeDocuments();

      expect(mockRepo.query).toHaveBeenCalledWith(
        'TRUNCATE TABLE "type_document" RESTART IDENTITY CASCADE',
      );
    });
  });
});
