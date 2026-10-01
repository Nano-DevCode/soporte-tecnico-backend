import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { ConflictException } from '@nestjs/common';
import { ItAssetsModelsService } from './it-assets-models.service';
import { ItAssetsModel } from '../entities/it-assets-model.entity';
import { CreateItAssetsModelDto } from '../dto/create-it-assets-model.dto';
import { UpdateItAssetsModelDto } from '../dto/update-it-assets-model.dto';

describe('ItAssetsModelsService', () => {
  let service: ItAssetsModelsService;
  let repository: jest.Mocked<Repository<ItAssetsModel>>;

  const mockModel: ItAssetsModel = {
    id: 'model-uuid-1',
    name: 'LATITUDE 5420',
    createdAt: new Date(),
    updatedAt: new Date(),
    brand: {
      id: 'brand-uuid-1',
      name: 'DELL',
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    },
    itAssets: [],
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItAssetsModelsService,
        {
          provide: getRepositoryToken(ItAssetsModel),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            preload: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<ItAssetsModelsService>(ItAssetsModelsService);
    repository = module.get(getRepositoryToken(ItAssetsModel));
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y guardar un nuevo modelo', async () => {
      const dto: CreateItAssetsModelDto = {
        name: 'LATITUDE 5420',
        brandId: 'brand-uuid-1',
      };
      repository.create.mockReturnValue(mockModel);
      repository.save.mockResolvedValue(mockModel);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        name: dto.name,
        brand: { id: dto.brandId },
      });
      expect(repository.save).toHaveBeenCalledWith(mockModel);
      expect(result).toEqual(mockModel);
    });

    it('debe lanzar ConflictException si la marca no existe (Error 23503)', async () => {
      const dto: CreateItAssetsModelDto = {
        name: 'LATITUDE 5420',
        brandId: 'non-existing-brand',
      };
      const dbError = {
        code: '23503',
        detail: 'Key (brandId)=(non-existing-brand) is not present.',
      };
      repository.create.mockReturnValue(mockModel);
      repository.save.mockRejectedValue(dbError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('debe retornar modelos con paginación y filtros', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockModel], 1]);

      const result = await service.findAll({
        limit: 10,
        offset: 0,
        query: 'latitude',
        brandId: 'brand-uuid-1',
      });

      expect(repository.createQueryBuilder).toHaveBeenCalledWith(
        'itAssetsModel',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(itAssetsModel.name) LIKE :query',
        { query: '%latitude%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'brand.id = :brandId',
        { brandId: 'brand-uuid-1' },
      );
      expect(result).toEqual({
        itAssetsModels: [mockModel],
        meta: { total: 1, page: 1, lastPage: 1 },
      });
    });
  });

  describe('update', () => {
    it('debe actualizar el modelo exitosamente', async () => {
      const dto: UpdateItAssetsModelDto = { name: 'LATITUDE 5430' };
      const updatedModel = { ...mockModel, name: 'LATITUDE 5430' };
      repository.preload.mockResolvedValue(updatedModel);
      repository.save.mockResolvedValue(updatedModel);

      const result = await service.update('model-uuid-1', dto);

      expect(repository.preload).toHaveBeenCalledWith({
        id: 'model-uuid-1',
        ...dto,
      });
      expect(repository.save).toHaveBeenCalledWith(updatedModel);
      expect(result).toEqual(updatedModel);
    });

    it('debe retornar null si preload no encuentra el modelo', async () => {
      repository.preload.mockResolvedValue(undefined);

      const result = await service.update('not-found', { name: 'X' });
      expect(result).toBeNull();
    });
  });
});
