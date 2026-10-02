import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ConsumableSeedService } from './consumable-seed.service';
import { BrandConsumablesService } from '../brands/brand-consumables.service';
import { TypeconsumablesService } from '../types/typeconsumables.service';
import { UnitMeasurementService } from '../units/unit-measurement.service';
import { ConsumableUbicationsService } from '../ubications/consumable_ubications.service';
import { MovementTypesService } from '../movements/types/movement_types.service';
import { MovementAplicationsService } from '../movements/applications/movement_aplications.service';
import { ConsumablesCrudService } from '../services/consumables-crud.service';
import { BatchesproductsService } from '../batches/batchesproducts.service';
import { Consumable } from '../entities/consumable.entity';

describe('ConsumableSeedService', () => {
  let service: ConsumableSeedService;

  const mockConsumableRepository = {
    count: jest.fn(),
    findOne: jest.fn(),
  };

  const mockBrandConsumablesService = {
    createSeedBrands: jest.fn().mockResolvedValue({ id: 'brand-uuid' }),
  };
  const mockTypeconsumablesService = {
    createSeedTypesConsumables: jest.fn().mockResolvedValue({ id: 1 }),
  };
  const mockUnitMeasurementService = {
    createSeedUnitMeasurements: jest.fn().mockResolvedValue({ id: 1 }),
  };
  const mockConsumableUbicationsService = {
    createSeedConsumableUbications: jest.fn().mockResolvedValue({ id: 'ub-uuid' }),
  };
  const mockMovementTypesService = {
    createSeedMovementTypes: jest.fn().mockResolvedValue({ id: 1 }),
  };
  const mockMovementAplicationsService = {
    createSeedMovementAplications: jest.fn().mockResolvedValue({ id: 1 }),
  };

  const mockConsumablesCrudService = {
    create: jest.fn().mockImplementation((dto) =>
      Promise.resolve({
        id: 'c-uuid-1',
        ...dto,
      }),
    ),
  };

  const mockBatchesproductsService = {
    create: jest.fn().mockResolvedValue({ id: 'batch-uuid' }),
  };

  const mockCatalogRepo = {
    find: jest.fn().mockImplementation(() =>
      Promise.resolve([
        { id: 'b-hp', name: 'HP' },
        { id: 'b-epson', name: 'Epson' },
        { id: 'b-brother', name: 'Brother' },
        { id: 'b-belden', name: 'Belden' },
        { id: 'b-steren', name: 'Steren' },
        { id: 'b-cisco', name: 'Cisco' },
        { id: 'b-silimex', name: 'Silimex' },
        { id: 'b-3m', name: '3M' },
        { id: 'b-kingston', name: 'Kingston' },
        { id: 'b-logitech', name: 'Logitech' },

        { id: 1, name: 'Material de Oficina' },
        { id: 2, name: 'Material de Limpieza' },
        { id: 3, name: 'Material para Redes' },
        { id: 4, name: 'Material para Impresoras' },
        { id: 5, name: 'Material de Cómputo' },

        { id: 1, name: 'Fraccionario' },
        { id: 2, name: 'Unitario' },

        { id: 'ub-1', name: 'Área de Impresión - Mueble Consumibles' },
        { id: 'ub-2', name: 'Bodega de Redes - Rack Accesorios' },
        { id: 'ub-3', name: 'Taller de Soporte - Estante Herramientas' },
        { id: 'ub-4', name: 'Almacén Central - Gaveta B2' },
        { id: 'ub-5', name: 'Almacén Central - Anaquel A1' },
        { id: 'ub-6', name: 'SITE Principal - Gabinete TI' },
      ]),
    ),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockCatalogRepo),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumableSeedService,
        {
          provide: getRepositoryToken(Consumable),
          useValue: mockConsumableRepository,
        },
        {
          provide: BrandConsumablesService,
          useValue: mockBrandConsumablesService,
        },
        {
          provide: TypeconsumablesService,
          useValue: mockTypeconsumablesService,
        },
        {
          provide: UnitMeasurementService,
          useValue: mockUnitMeasurementService,
        },
        {
          provide: ConsumableUbicationsService,
          useValue: mockConsumableUbicationsService,
        },
        {
          provide: MovementTypesService,
          useValue: mockMovementTypesService,
        },
        {
          provide: MovementAplicationsService,
          useValue: mockMovementAplicationsService,
        },
        {
          provide: ConsumablesCrudService,
          useValue: mockConsumablesCrudService,
        },
        {
          provide: BatchesproductsService,
          useValue: mockBatchesproductsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ConsumableSeedService>(ConsumableSeedService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe lanzar ConflictException si ya existen consumibles', async () => {
    mockConsumableRepository.count.mockResolvedValueOnce(3);

    await expect(service.RunSeed()).rejects.toThrow(ConflictException);
    expect(mockConsumableRepository.count).toHaveBeenCalled();
  });

  it('RunSeed debe insertar catálogos, productos consumibles y el lote inicial', async () => {
    mockConsumableRepository.count.mockResolvedValueOnce(0);
    mockConsumableRepository.findOne.mockResolvedValue(null);

    const result = await service.RunSeed();

    expect(result).toEqual({
      message: 'Seed de consumibles ejecutado correctamente',
    });
    expect(mockBrandConsumablesService.createSeedBrands).toHaveBeenCalled();
    expect(mockTypeconsumablesService.createSeedTypesConsumables).toHaveBeenCalled();
    expect(mockUnitMeasurementService.createSeedUnitMeasurements).toHaveBeenCalled();
    expect(mockConsumableUbicationsService.createSeedConsumableUbications).toHaveBeenCalled();
    expect(mockMovementTypesService.createSeedMovementTypes).toHaveBeenCalled();
    expect(mockMovementAplicationsService.createSeedMovementAplications).toHaveBeenCalled();

    expect(mockConsumablesCrudService.create).toHaveBeenCalled();
    expect(mockBatchesproductsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        num_requirement: 'REQ-INIT-2026-001',
        items: expect.any(Array),
      }),
    );
  });
});
