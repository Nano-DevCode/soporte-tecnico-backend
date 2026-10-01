import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ItAssetsBrandsService } from './it-assets-brands.service';
import { ItAssetsBrand } from '../entities/it-assets-brand.entity';
import { CreateItAssetsBrandDto } from '../dto/create-it-assets-brand.dto';
import { UpdateItAssetsBrandDto } from '../dto/update-it-assets-brand.dto';

describe('ItAssetsBrandsService', () => {
  let service: ItAssetsBrandsService;
  let repository: jest.Mocked<Repository<ItAssetsBrand>>;

  const mockBrand: ItAssetsBrand = {
    id: 'brand-uuid-1',
    name: 'DELL',
    createdAt: new Date(),
    updatedAt: new Date(),
    models: [],
  };

  const mockQueryBuilder = {
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
        ItAssetsBrandsService,
        {
          provide: getRepositoryToken(ItAssetsBrand),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
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

    service = module.get<ItAssetsBrandsService>(ItAssetsBrandsService);
    repository = module.get(getRepositoryToken(ItAssetsBrand));
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y guardar una nueva marca', async () => {
      const dto: CreateItAssetsBrandDto = { name: 'DELL' };
      repository.create.mockReturnValue(mockBrand);
      repository.save.mockResolvedValue(mockBrand);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockBrand);
      expect(result).toEqual(mockBrand);
    });

    it('debe lanzar ConflictException si el nombre ya existe', async () => {
      const dto: CreateItAssetsBrandDto = { name: 'DELL' };
      const dbError = {
        code: '23505',
        detail: 'Key (name)=(DELL) already exists.',
      };
      repository.create.mockReturnValue(mockBrand);
      repository.save.mockRejectedValue(dbError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('debe retornar marcas con paginación y filtros', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockBrand], 1]);

      const result = await service.findAll({
        limit: 10,
        offset: 0,
        query: 'dell',
      });

      expect(repository.createQueryBuilder).toHaveBeenCalledWith(
        'itAssetsBrand',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(itAssetsBrand.name) LIKE :query',
        { query: '%dell%' },
      );
      expect(result).toEqual({
        itAssetsBrands: [mockBrand],
        meta: { total: 1, page: 1, lastPage: 1 },
      });
    });
  });

  describe('update', () => {
    it('debe actualizar la marca exitosamente', async () => {
      const dto: UpdateItAssetsBrandDto = { name: 'HP' };
      const updateResult = { generatedMaps: [], raw: [], affected: 1 };
      repository.update.mockResolvedValue(updateResult);

      const result = await service.update('brand-uuid-1', dto);

      expect(repository.update).toHaveBeenCalledWith('brand-uuid-1', dto);
      expect(result).toEqual(updateResult);
    });

    it('debe lanzar BadRequestException si hay error de llave foránea', async () => {
      const dto: UpdateItAssetsBrandDto = { name: 'HP' };
      const dbError = { code: '23503', detail: 'Foreign key error' };
      repository.update.mockRejectedValue(dbError);

      await expect(service.update('brand-uuid-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
