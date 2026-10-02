import { Test, TestingModule } from '@nestjs/testing';
import { UnitMeasurementService } from './unit-measurement.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnitMeasurement } from './entities/unit-measurement.entity';
import { I18nService } from 'nestjs-i18n';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UnitMeasurementService', () => {
  let service: UnitMeasurementService;

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
        UnitMeasurementService,
        {
          provide: getRepositoryToken(UnitMeasurement),
          useValue: mockRepo,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<UnitMeasurementService>(UnitMeasurementService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe lanzar ConflictException si la unidad ya existe', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 1, name: 'Pieza' });
      await expect(service.create({ name: 'Pieza' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe crear y guardar la unidad exitosamente', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const entity = { id: 1, name: 'Pieza' };
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      const result = await service.create({ name: 'Pieza' });
      expect(result).toEqual(entity);
    });
  });

  describe('findOne', () => {
    it('debe retornar la unidad si existe', async () => {
      const entity = { id: 1, name: 'Pieza' };
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
    it('debe retornar unidades paginadas', async () => {
      const list = [{ id: 1, name: 'Pieza' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([list, 1]);

      const result = await service.findAll({ limit: 10, offset: 0 });
      expect(result.units).toEqual(list);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('remove', () => {
    it('debe eliminar la unidad si existe', async () => {
      const entity = { id: 1, name: 'Pieza' };
      mockRepo.findOne.mockResolvedValue(entity);
      mockRepo.remove.mockResolvedValue(entity);

      const result = await service.remove(1);
      expect(result).toEqual({ id: 1, deleted: true });
    });
  });

  describe('deleteAllUnitMeasurements', () => {
    it('debe ejecutar delete query builder', async () => {
      mockQueryBuilder.execute.mockResolvedValue(undefined);
      await service.deleteAllUnitMeasurements();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });
  });
});
