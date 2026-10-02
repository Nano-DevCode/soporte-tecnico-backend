import { Test, TestingModule } from '@nestjs/testing';
import { BrandConsumablesService } from './brand-consumables.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BrandConsumable } from './entities/brand-consumable.entity';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('BrandConsumablesService', () => {
  let service: BrandConsumablesService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockI18n = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandConsumablesService,
        {
          provide: getRepositoryToken(BrandConsumable),
          useValue: mockRepo,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<BrandConsumablesService>(BrandConsumablesService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe lanzar BadRequestException si el nombre es menor a 2 caracteres', async () => {
      await expect(service.create({ name: 'A' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar ConflictException si el nombre ya existe', async () => {
      mockRepo.findOne.mockResolvedValue({ id: '1', name: 'HP' });
      await expect(service.create({ name: 'HP' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe crear y guardar la marca correctamente', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const entity = { id: '1', name: 'HP' };
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      const result = await service.create({ name: 'HP' });
      expect(result).toEqual(entity);
    });
  });

  describe('findOne', () => {
    it('debe retornar la marca si existe', async () => {
      const entity = { id: '1', name: 'HP' };
      mockRepo.findOneBy.mockResolvedValue(entity);

      const result = await service.findOne('1');
      expect(result).toEqual(entity);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar lista paginada de marcas', async () => {
      const list = [{ id: '1', name: 'HP' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([list, 1]);

      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(result.brands).toEqual(list);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('remove', () => {
    it('debe eliminar la marca si existe', async () => {
      const entity = { id: '1', name: 'HP' };
      mockRepo.findOneBy.mockResolvedValue(entity);
      mockRepo.remove.mockResolvedValue(entity);

      const result = await service.remove('1');
      expect(result).toEqual({ id: '1', deleted: true });
    });
  });

  describe('deleteAllBrands', () => {
    it('debe ejecutar query builder delete', async () => {
      mockQueryBuilder.execute.mockResolvedValue(undefined);

      await service.deleteAllBrands();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });
  });
});
