import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { EquipmentSeedService } from './equipment-seed.service';
import { BrandsService } from '../brands/brands.service';
import { PrintingtypesService } from '../hardware/printers/printing-types/printingtypes.service';
import { PrinterfunctiontypesService } from '../hardware/printers/function-types/printerfunctiontypes.service';
import { EquipmenttypesService } from '../types/equipmenttypes.service';
import { ComputerequipmenttypesService } from '../hardware/computers/types/computerequipmenttypes.service';
import { StoragetypesService } from '../hardware/computers/storage-types/storagetypes.service';
import { OperatingsystemsService } from '../hardware/computers/operating-systems/operatingsystems.service';
import { ComputerprocessorsService } from '../hardware/computers/processors/computerprocessors.service';
import { TypenetworksService } from '../hardware/networks/types/typenetworks.service';
import { DepartmentsService } from 'src/departments/services/departments.service';
import { EquipmentCrudService } from '../services/equipment-crud.service';

import { Equipment } from '../entities/equipment.entity';
import { Model } from '../models/entities/model.entity';
import { Responsibleequipment } from '../responsibles/entities/responsibleequipment.entity';

describe('EquipmentSeedService', () => {
  let service: EquipmentSeedService;

  const mockEquipmentRepository = {
    count: jest.fn(),
    findOne: jest.fn(),
  };

  const mockModelRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve({ id: 'model-uuid', ...entity })),
  };

  const mockResponsibleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) => Promise.resolve({ id: 'resp-uuid', ...entity })),
  };

  const mockBrandsService = {
    createSeedBrands: jest.fn().mockResolvedValue({ id: 'brand-uuid' }),
  };
  const mockPrintingtypesService = {
    createSeedPrintintypes: jest.fn().mockResolvedValue({ id: 'pt-uuid' }),
  };
  const mockPrinterfunctiontypesService = {
    createSeedPrinterfunctiontypes: jest.fn().mockResolvedValue({ id: 'pft-uuid' }),
  };
  const mockEquipmentsTypesService = {
    createSeedEquipmentsTypes: jest.fn().mockResolvedValue({ id: 1 }),
  };
  const mockComputerequipmenttypesService = {
    createSeedComputerEquipmentTypes: jest.fn().mockResolvedValue({ id: 'cet-uuid' }),
  };
  const mockStoragetypesService = {
    createSeedStorageTypes: jest.fn().mockResolvedValue({ id: 'st-uuid' }),
  };
  const mockOperatingsystemsService = {
    createSeedOperatingSystems: jest.fn().mockResolvedValue({ id: 'os-uuid' }),
  };
  const mockComputerprocessorsService = {
    createSeedComputerProcessor: jest.fn().mockResolvedValue({ id: 'proc-uuid' }),
  };
  const mockTypenetworksService = {
    createSeedTypeNetworks: jest.fn().mockResolvedValue({ id: 'tn-uuid' }),
  };

  const mockDepartmentsService = {
    findAll: jest.fn().mockResolvedValue([
      { id: 'dept-uuid-sc', name: 'Departamento de Sistemas y Computación', acronym: 'SC' },
      { id: 'dept-uuid-cc', name: 'Departamento de Centro de Cómputo', acronym: 'CC' },
    ]),
  };

  const mockEquipmentCrudService = {
    create: jest.fn().mockResolvedValue({ id: 'equipment-uuid' }),
  };

  const mockGenericRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: 'generic-uuid', name: 'test' }),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockGenericRepo),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentSeedService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: mockEquipmentRepository,
        },
        {
          provide: getRepositoryToken(Model),
          useValue: mockModelRepository,
        },
        {
          provide: getRepositoryToken(Responsibleequipment),
          useValue: mockResponsibleRepository,
        },
        { provide: BrandsService, useValue: mockBrandsService },
        { provide: PrintingtypesService, useValue: mockPrintingtypesService },
        {
          provide: PrinterfunctiontypesService,
          useValue: mockPrinterfunctiontypesService,
        },
        {
          provide: EquipmenttypesService,
          useValue: mockEquipmentsTypesService,
        },
        {
          provide: ComputerequipmenttypesService,
          useValue: mockComputerequipmenttypesService,
        },
        { provide: StoragetypesService, useValue: mockStoragetypesService },
        {
          provide: OperatingsystemsService,
          useValue: mockOperatingsystemsService,
        },
        {
          provide: ComputerprocessorsService,
          useValue: mockComputerprocessorsService,
        },
        { provide: TypenetworksService, useValue: mockTypenetworksService },
        { provide: DepartmentsService, useValue: mockDepartmentsService },
        { provide: EquipmentCrudService, useValue: mockEquipmentCrudService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<EquipmentSeedService>(EquipmentSeedService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe lanzar ConflictException si ya existen equipos registrados', async () => {
    mockEquipmentRepository.count.mockResolvedValueOnce(5);

    await expect(service.RunSeed()).rejects.toThrow(ConflictException);
    expect(mockEquipmentRepository.count).toHaveBeenCalled();
  });

  it('RunSeed debe insertar catálogos, modelos, responsables y equipos cuando no hay registros', async () => {
    mockEquipmentRepository.count.mockResolvedValueOnce(0);
    mockModelRepository.find.mockResolvedValue([
      { id: 'mod-1', name: 'OptiPlex 7090', id_brand: { id: 'b-1', name: 'Dell' } },
    ]);
    mockResponsibleRepository.find.mockResolvedValue([
      { id: 'resp-1', mail: 'carlos.mendoza@itoaxaca.edu.mx' },
    ]);
    mockGenericRepo.find.mockImplementation(() =>
      Promise.resolve([
        { id: 1, name: 'Computadora' },
        { id: 2, name: 'Red' },
        { id: 3, name: 'Impresora' },
        { id: 'desktop-id', name: 'Desktop' },
        { id: 'ssd-id', name: 'SSD NVMe' },
        { id: 'win11-id', name: 'Windows 11' },
        { id: 'proc-id', model: 'Core i7-10700' },
        { id: 'laser-id', name: 'Laser' },
        { id: 'multi-id', name: 'Multifuncional' },
        { id: 'switch-id', name: 'Switch' },
      ]),
    );

    const result = await service.RunSeed();

    expect(result).toEqual({ message: 'Seed de equipos ejecutado correctamente' });
    expect(mockBrandsService.createSeedBrands).toHaveBeenCalled();
    expect(mockEquipmentCrudService.create).toHaveBeenCalled();
  });
});
