import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpdateResult } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ToolsModelsService } from './tools-models.service';
import { ToolsModel } from '../entities/tools-model.entity';
import { CreateToolsModelDto } from '../dto/create-tools-model.dto';
import { FilterToolsModelDto } from '../dto/filter-tools-model.dto';

describe('ToolsModelsService', () => {
  let service: ToolsModelsService;

  const mockModel: ToolsModel = {
    id: 'model-uuid',
    name: 'DCD771C2',
    createdAt: new Date(),
    updatedAt: new Date(),
    brand: {
      id: 'brand-uuid-1',
      name: 'DEWALT',
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    },
    tools: [],
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
        ToolsModelsService,
        {
          provide: getRepositoryToken(ToolsModel),
          useValue: mockRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<ToolsModelsService>(ToolsModelsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateToolsModelDto = {
      name: 'DCD771C2',
      brandId: 'brand-uuid-1',
    };

    it('should create and save a new tools model', async () => {
      mockRepository.create.mockReturnValue(mockModel);
      mockRepository.save.mockResolvedValue(mockModel);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: createDto.name,
        brand: { id: createDto.brandId },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockModel);
      expect(result).toEqual(mockModel);
    });

    it('should throw ConflictException if model name already exists (23505)', async () => {
      mockRepository.create.mockReturnValue(mockModel);
      mockRepository.save.mockRejectedValue({
        code: '23505',
        detail: 'Key (name)=(DCD771C2) already exists.',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if other 23505 error occurs', async () => {
      mockRepository.create.mockReturnValue(mockModel);
      mockRepository.save.mockRejectedValue({
        code: '23505',
        detail: 'Other unique violation',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if brand does not exist (23503)', async () => {
      mockRepository.create.mockReturnValue(mockModel);
      mockRepository.save.mockRejectedValue({
        code: '23503',
        detail: 'Key (brandId)=(invalid-id) not found.',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if other 23503 error occurs', async () => {
      mockRepository.create.mockReturnValue(mockModel);
      mockRepository.save.mockRejectedValue({
        code: '23503',
        detail: 'Other foreign key violation',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on unexpected database error', async () => {
      mockRepository.create.mockReturnValue(mockModel);
      mockRepository.save.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.create(createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated tools models without filters', async () => {
      const filterDto: FilterToolsModelDto = { limit: 10, offset: 0 };
      const models = [mockModel];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([models, 1]);

      const result = await service.findAll(filterDto);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual({
        toolsModels: models,
        meta: {
          total: 1,
          page: 1,
          lastPage: 1,
        },
      });
    });

    it('should apply query and brandId filters when provided', async () => {
      const filterDto: FilterToolsModelDto = {
        limit: 5,
        offset: 5,
        query: 'taladro',
        brandId: 'brand-uuid-1',
      };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'toolsModel.name LIKE :query',
        { query: '%taladro%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'brand.id = :brandId',
        { brandId: 'brand-uuid-1' },
      );
      expect(result.meta.page).toBe(2);
    });
  });

  describe('update', () => {
    it('should update a tools model', async () => {
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      mockRepository.update.mockResolvedValue(updateResult);

      const result = await service.update('model-uuid', {
        name: 'UPDATED MODEL',
      });

      expect(mockRepository.update).toHaveBeenCalledWith('model-uuid', {
        name: 'UPDATED MODEL',
      });
      expect(result).toEqual(updateResult);
    });

    it('should catch error and throw in handleDBExceptions', async () => {
      mockRepository.update.mockRejectedValue({
        code: '23505',
        detail: 'Key (name)=(EXISTS) already exists.',
      });

      await expect(
        service.update('model-uuid', { name: 'EXISTS' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
