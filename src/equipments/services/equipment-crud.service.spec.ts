import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

import { EquipmentCrudService } from './equipment-crud.service';
import { EquipmentQueriesService } from './equipment-queries.service';
import { Equipment } from '../entities/equipment.entity';
import { Equipmenttype } from '../types/entities/equipmenttype.entity';
import { ComputersService } from '../hardware/computers/computers.service';
import { PrintersService } from '../hardware/printers/printers.service';
import { NetworksService } from '../hardware/networks/networks.service';
import { CreateEquipmentDto } from '../dto/create-equipment.dto';
import { UpdateEquipmentDto } from '../dto/update-equipment.dto';

describe('EquipmentCrudService', () => {
  let service: EquipmentCrudService;
  let equipmentRepo: jest.Mocked<Repository<Equipment>>;
  let typeRepo: jest.Mocked<Repository<Equipmenttype>>;
  let computersService: jest.Mocked<ComputersService>;
  let printersService: jest.Mocked<PrintersService>;
  let networksService: jest.Mocked<NetworksService>;
  let queriesService: jest.Mocked<EquipmentQueriesService>;
  let queryRunnerMock: Partial<QueryRunner> & {
    manager: Partial<EntityManager>;
  };

  const MOCK_EQUIPMENT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const MOCK_MODEL_ID = '5a2e81b4-96c2-4d11-8231-1823746de50M';

  const mockTypes = {
    computer: { id: 1, name: 'Computadora' } as Equipmenttype,
    printer: { id: 2, name: 'Impresora' } as Equipmenttype,
    network: { id: 3, name: 'Red' } as Equipmenttype,
  };

  const mockEquipment = {
    id: MOCK_EQUIPMENT_ID,
    num_inventario: 'INV-1001',
    description: 'PC de prueba',
    status: true,
    id_type_equipment: mockTypes.computer,
    computer: { id: 'comp-123' },
  } as unknown as Equipment;

  beforeEach(async () => {
    queryRunnerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        create: jest.fn().mockImplementation((entityClass, data) => ({
          id: MOCK_EQUIPMENT_ID,
          ...data,
        })),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        preload: jest
          .fn()
          .mockImplementation((entityClass, data) =>
            Promise.resolve({ ...mockEquipment, ...data }),
          ),
      },
    };

    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentCrudService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: {
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Equipmenttype),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: ComputersService,
          useValue: {
            createWithTransaction: jest
              .fn()
              .mockResolvedValue({ id: 'comp-1' }),
            updateWithTransaction: jest
              .fn()
              .mockResolvedValue({ id: 'comp-1' }),
          },
        },
        {
          provide: PrintersService,
          useValue: {
            createWithTransaction: jest
              .fn()
              .mockResolvedValue({ id: 'print-1' }),
            updateWithTransaction: jest
              .fn()
              .mockResolvedValue({ id: 'print-1' }),
          },
        },
        {
          provide: NetworksService,
          useValue: {
            createWithTransaction: jest.fn().mockResolvedValue({ id: 'net-1' }),
            updateWithTransaction: jest.fn().mockResolvedValue({ id: 'net-1' }),
          },
        },
        {
          provide: EquipmentQueriesService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockEquipment),
            mapToDto: jest.fn().mockReturnValue({ id: MOCK_EQUIPMENT_ID }),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<EquipmentCrudService>(EquipmentCrudService);
    equipmentRepo = module.get(getRepositoryToken(Equipment));
    typeRepo = module.get(getRepositoryToken(Equipmenttype));
    computersService = module.get(ComputersService);
    printersService = module.get(PrintersService);
    networksService = module.get(NetworksService);
    queriesService = module.get(EquipmentQueriesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un equipo tipo computadora exitosamente', async () => {
      typeRepo.findOneBy.mockResolvedValue(mockTypes.computer);
      equipmentRepo.findOne.mockResolvedValue(null);

      const createDto: CreateEquipmentDto = {
        num_inventario: 'INV-1001',
        num_serial: 'SN-1001',
        id_model: MOCK_MODEL_ID,
        id_type_equipment: 1,
        status: true,
        description: 'Computadora de oficina',
        computer: {
          ram: '16GB',
          capacity_storage: '512GB',
          available_storage: '256GB',
          id_processor: 1,
          id_type_operating_system: 1,
          id_type_storage: 1,
          id_type_equipment_computer: 1,
        },
      };

      const result = await service.create(createDto);

      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(computersService.createWithTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('debe crear un equipo tipo impresora exitosamente', async () => {
      typeRepo.findOneBy.mockResolvedValue(mockTypes.printer);
      equipmentRepo.findOne.mockResolvedValue(null);

      const createDto: CreateEquipmentDto = {
        num_inventario: 'INV-1002',
        id_model: MOCK_MODEL_ID,
        id_type_equipment: 2,
        status: true,
        description: 'Impresora láser',
        printer: {
          ip: '192.168.1.50',
          id_printer_type: 1,
          id_function_type: 1,
        },
      };

      const result = await service.create(createDto);

      expect(printersService.createWithTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('debe crear un equipo tipo red exitosamente', async () => {
      typeRepo.findOneBy.mockResolvedValue(mockTypes.network);
      equipmentRepo.findOne.mockResolvedValue(null);

      const createDto: CreateEquipmentDto = {
        num_inventario: 'INV-1003',
        id_model: MOCK_MODEL_ID,
        id_type_equipment: 3,
        status: true,
        description: 'Switch de red',
        network: {
          ip: '192.168.1.1',
          id_type_network: 1,
        },
      };

      const result = await service.create(createDto);

      expect(networksService.createWithTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('debe lanzar ConflictException si el número de inventario está duplicado', async () => {
      typeRepo.findOneBy.mockResolvedValue(mockTypes.computer);
      equipmentRepo.findOne.mockResolvedValue(mockEquipment);

      const createDto: CreateEquipmentDto = {
        num_inventario: 'INV-1001',
        id_model: MOCK_MODEL_ID,
        id_type_equipment: 1,
        status: true,
        description: 'Test',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(queryRunnerMock.startTransaction).not.toHaveBeenCalled();
    });

    it('debe hacer rollback si ocurre un error durante la creación', async () => {
      typeRepo.findOneBy.mockResolvedValue(mockTypes.computer);
      equipmentRepo.findOne.mockResolvedValue(null);

      (queryRunnerMock.manager.save as jest.Mock).mockRejectedValue(
        new Error('DB Save Failed'),
      );

      const createDto: CreateEquipmentDto = {
        num_inventario: 'INV-1001',
        id_model: MOCK_MODEL_ID,
        id_type_equipment: 1,
        status: true,
        description: 'Test',
      };

      await expect(service.create(createDto)).rejects.toThrow();
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debe actualizar el equipo y delegar a subservicios correctamente', async () => {
      typeRepo.findOneBy.mockResolvedValue(mockTypes.computer);
      equipmentRepo.findOne.mockResolvedValue(null);

      const updateDto: UpdateEquipmentDto = {
        description: 'Nueva descripción',
      };

      const result = await service.update(MOCK_EQUIPMENT_ID, updateDto);

      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.manager.save).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('debe lanzar NotFoundException si no se encuentra el equipo al prealojar', async () => {
      typeRepo.findOneBy.mockResolvedValue(mockTypes.computer);
      equipmentRepo.findOne.mockResolvedValue(null);
      (queryRunnerMock.manager.preload as jest.Mock).mockResolvedValue(null);

      const updateDto: UpdateEquipmentDto = {
        description: 'Test',
      };

      await expect(
        service.update(MOCK_EQUIPMENT_ID, updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe remover el equipo correctamente', async () => {
      equipmentRepo.remove.mockResolvedValue(mockEquipment);

      const result = await service.remove(MOCK_EQUIPMENT_ID);
      expect(queriesService.findOne).toHaveBeenCalledWith(MOCK_EQUIPMENT_ID);
      expect(equipmentRepo.remove).toHaveBeenCalledWith(mockEquipment);
      expect(result).toEqual({ id: MOCK_EQUIPMENT_ID, deleted: true });
    });
  });
});
