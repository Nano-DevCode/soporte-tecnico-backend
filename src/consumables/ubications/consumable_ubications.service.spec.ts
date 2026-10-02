import { Test, TestingModule } from '@nestjs/testing';
import { ConsumableUbicationsService } from './consumable_ubications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConsumableUbication } from './entities/consumable_ubication.entity';
import { I18nService } from 'nestjs-i18n';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ConsumableUbicationsService', () => {
  let service: ConsumableUbicationsService;

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
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockI18n = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumableUbicationsService,
        {
          provide: getRepositoryToken(ConsumableUbication),
          useValue: mockRepo,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<ConsumableUbicationsService>(
      ConsumableUbicationsService,
    );
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe lanzar ConflictException si la ubicacion ya existe', async () => {
      mockRepo.findOne.mockResolvedValue({ id: '1', name: 'Estante A' });
      await expect(service.create({ name: 'Estante A' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe crear y guardar la ubicacion exitosamente', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const entity = { id: '1', name: 'Estante A' };
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      const result = await service.create({ name: 'Estante A' });
      expect(result).toEqual(entity);
    });
  });

  describe('findOne', () => {
    it('debe retornar la ubicacion si existe', async () => {
      const entity = { id: '1', name: 'Estante A' };
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
    it('debe retornar ubicaciones paginadas', async () => {
      const list = [{ id: '1', name: 'Estante A' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([list, 1]);

      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(result.ubications).toEqual(list);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('remove', () => {
    it('debe eliminar la ubicacion si existe', async () => {
      const entity = { id: '1', name: 'Estante A' };
      mockRepo.findOneBy.mockResolvedValue(entity);
      mockRepo.remove.mockResolvedValue(entity);

      const result = await service.remove('1');
      expect(result).toEqual({ id: '1', deleted: true });
    });
  });

  describe('deleteAllConsumableUbications', () => {
    it('debe ejecutar delete query builder', async () => {
      mockQueryBuilder.execute.mockResolvedValue(undefined);
      await service.deleteAllConsumableUbications();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });
  });
});
