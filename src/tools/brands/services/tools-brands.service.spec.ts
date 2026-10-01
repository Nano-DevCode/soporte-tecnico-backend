import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpdateResult } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ToolsBrandsService } from './tools-brands.service';
import { ToolsBrand } from '../entities/tools-brand.entity';
import { CreateToolsBrandDto } from '../dto/create-tools-brand.dto';
import { FilterToolsBrandDto } from '../dto/filter-tools-brand.dto';

describe('ToolsBrandsService', () => {
  let service: ToolsBrandsService;

  const mockBrand: ToolsBrand = {
    id: 'brand-uuid',
    name: 'MAKITA',
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

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsBrandsService,
        {
          provide: getRepositoryToken(ToolsBrand),
          useValue: mockRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<ToolsBrandsService>(ToolsBrandsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateToolsBrandDto = { name: 'MAKITA' };

    it('should create and save a new tools brand', async () => {
      mockRepository.create.mockReturnValue(mockBrand);
      mockRepository.save.mockResolvedValue(mockBrand);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockBrand);
      expect(result).toEqual(mockBrand);
    });

    it('should throw ConflictException on duplicate name (23505)', async () => {
      mockRepository.create.mockReturnValue(mockBrand);
      mockRepository.save.mockRejectedValue({
        code: '23505',
        detail: 'Key (name)=(MAKITA) already exists.',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException on other 23505 error', async () => {
      mockRepository.create.mockReturnValue(mockBrand);
      mockRepository.save.mockRejectedValue({
        code: '23505',
        detail: 'Other constraint violation',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on 23503 error', async () => {
      mockRepository.create.mockReturnValue(mockBrand);
      mockRepository.save.mockRejectedValue({
        code: '23503',
        detail: 'Foreign key violation',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      mockRepository.create.mockReturnValue(mockBrand);
      mockRepository.save.mockRejectedValue(new Error('Unknown DB error'));

      await expect(service.create(createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated brands without query', async () => {
      const filterDto: FilterToolsBrandDto = { limit: 10, offset: 0 };
      const brands = [mockBrand];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([brands, 1]);

      const result = await service.findAll(filterDto);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual({
        toolsBrands: brands,
        meta: { total: 1, page: 1, lastPage: 1 },
      });
    });

    it('should apply query filter when provided', async () => {
      const filterDto: FilterToolsBrandDto = {
        limit: 5,
        offset: 5,
        query: 'dewalt',
      };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'toolsBrand.name LIKE :query',
        { query: '%dewalt%' },
      );
      expect(result.meta.page).toBe(2);
    });
  });

  describe('update', () => {
    it('should update a tools brand', async () => {
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      mockRepository.update.mockResolvedValue(updateResult);

      const result = await service.update('brand-uuid', {
        name: 'DEWALT NEW',
      });

      expect(mockRepository.update).toHaveBeenCalledWith('brand-uuid', {
        name: 'DEWALT NEW',
      });
      expect(result).toEqual(updateResult);
    });

    it('should handle error during update', async () => {
      mockRepository.update.mockRejectedValue({
        code: '23505',
        detail: 'Key (name)=(DUP) already exists.',
      });

      await expect(
        service.update('brand-uuid', { name: 'DUP' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
