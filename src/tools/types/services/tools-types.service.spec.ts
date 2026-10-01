import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpdateResult } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ToolsTypesService } from './tools-types.service';
import { ToolsType } from '../entities/tools-type.entity';
import { CreateToolsTypeDto } from '../dto/create-tools-type.dto';
import { FilterToolsTypeDto } from '../dto/filter-tools-type.dto';

describe('ToolsTypesService', () => {
  let service: ToolsTypesService;

  const mockType: ToolsType = {
    id: 'type-uuid',
    name: 'MANUAL',
    createdAt: new Date(),
    updatedAt: new Date(),
    tools: [],
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
        ToolsTypesService,
        {
          provide: getRepositoryToken(ToolsType),
          useValue: mockRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<ToolsTypesService>(ToolsTypesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateToolsTypeDto = { name: 'MANUAL' };

    it('should create and save a new tools type', async () => {
      mockRepository.create.mockReturnValue(mockType);
      mockRepository.save.mockResolvedValue(mockType);

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockType);
      expect(result).toEqual(mockType);
    });

    it('should throw ConflictException on duplicate name (23505)', async () => {
      mockRepository.create.mockReturnValue(mockType);
      mockRepository.save.mockRejectedValue({
        code: '23505',
        detail: 'Key (name)=(MANUAL) already exists.',
      });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException on other 23505 error', async () => {
      mockRepository.create.mockReturnValue(mockType);
      mockRepository.save.mockRejectedValue({
        code: '23505',
        detail: 'Other constraint',
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on 23503 error', async () => {
      mockRepository.create.mockReturnValue(mockType);
      mockRepository.save.mockRejectedValue({
        code: '23503',
        detail: 'FK violation',
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      mockRepository.create.mockReturnValue(mockType);
      mockRepository.save.mockRejectedValue(new Error('Unknown DB error'));

      await expect(service.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated tools types without query', async () => {
      const filterDto: FilterToolsTypeDto = { limit: 10, offset: 0 };
      const items = [mockType];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([items, 1]);

      const result = await service.findAll(filterDto);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual({
        toolsTypes: items,
        meta: { total: 1, page: 1, lastPage: 1 },
      });
    });

    it('should apply query filter when provided', async () => {
      const filterDto: FilterToolsTypeDto = {
        limit: 5,
        offset: 5,
        query: 'eléctrica',
      };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'toolsType.name LIKE :query',
        { query: '%eléctrica%' },
      );
      expect(result.meta.page).toBe(2);
    });
  });

  describe('update', () => {
    it('should update tools type', async () => {
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      mockRepository.update.mockResolvedValue(updateResult);

      const result = await service.update('type-uuid', {
        name: 'MANUAL AVANZADA',
      });

      expect(mockRepository.update).toHaveBeenCalledWith('type-uuid', {
        name: 'MANUAL AVANZADA',
      });
      expect(result).toEqual(updateResult);
    });

    it('should handle error during update', async () => {
      mockRepository.update.mockRejectedValue({
        code: '23505',
        detail: 'Key (name)=(DUP) already exists.',
      });

      await expect(
        service.update('type-uuid', { name: 'DUP' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
