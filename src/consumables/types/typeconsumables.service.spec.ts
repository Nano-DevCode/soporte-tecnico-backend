import { Test, TestingModule } from '@nestjs/testing';
import { TypeconsumablesService } from './typeconsumables.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Typeconsumable } from './entities/typeconsumable.entity';
import { I18nService } from 'nestjs-i18n';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('TypeconsumablesService', () => {
  let service: TypeconsumablesService;

  const mockQueryBuilder = {
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockI18n = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeconsumablesService,
        {
          provide: getRepositoryToken(Typeconsumable),
          useValue: mockRepo,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<TypeconsumablesService>(TypeconsumablesService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe lanzar ConflictException si el nombre ya existe', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 1, name: 'Toner' });
      await expect(service.create({ name: 'Toner' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe crear y guardar el tipo exitosamente', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const entity = { id: 1, name: 'Toner' };
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      const result = await service.create({ name: 'Toner' });
      expect(result).toEqual(entity);
    });
  });

  describe('findOne', () => {
    it('debe retornar el tipo si existe', async () => {
      const entity = { id: 1, name: 'Toner' };
      mockRepo.findOne.mockResolvedValue(entity);

      const result = await service.findOne(1);
      expect(result).toEqual(entity);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('debe retornar tipos paginados', async () => {
      const list = [{ id: 1, name: 'Toner' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([list, 1]);

      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(result.types).toEqual(list);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('remove', () => {
    it('debe eliminar el tipo si existe', async () => {
      const entity = { id: 1, name: 'Toner' };
      mockRepo.findOne.mockResolvedValue(entity);
      mockRepo.remove.mockResolvedValue(entity);

      const result = await service.remove(1);
      expect(result).toEqual({ id: 1, deleted: true });
    });
  });

  describe('deleteAllTypesConsumables', () => {
    it('debe ejecutar delete query builder', async () => {
      mockQueryBuilder.execute.mockResolvedValue(undefined);
      await service.deleteAllTypesConsumables();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });
  });
});
