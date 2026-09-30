import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { EquipmentsService } from './equipments.service';
import { Equipment } from './entities/equipment.entity';
import { Equipmenttype } from 'src/equipmenttypes/entities/equipmenttype.entity';
import { ComputersService } from 'src/computers/computers.service';
import { PrintersService } from 'src/printers/printers.service';
import { NetworksService } from 'src/networks/networks.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

describe('EquipmentsService', () => {
  let service: EquipmentsService;
  let equipmentRepo: jest.Mocked<Repository<Equipment>>;
  let typeRepo: jest.Mocked<Repository<Equipmenttype>>;
  let computersService: jest.Mocked<ComputersService>;
  let printersService: jest.Mocked<PrintersService>;
  let networksService: jest.Mocked<NetworksService>;
  let queryRunnerMock: Partial<QueryRunner> & {
    manager: Partial<EntityManager>;
  };

  // --- MOCK DATA FIXTURES ---
  const MOCK_EQUIPMENT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const MOCK_MODEL_ID = '5a2e81b4-96c2-4d11-8231-1823746de50M';

  const mockTypes = {
    computer: { id: 1, name: 'Computadora' } as Equipmenttype,
    printer: { id: 2, name: 'Impresora' } as Equipmenttype,
    network: { id: 3, name: 'Red' } as Equipmenttype,
  };

  const mockEquipments = {
    computer: {
      id: MOCK_EQUIPMENT_ID,
      num_inventario: 'INV-1001',
      description: 'PC de prueba',
      status: true,
      id_type_equipment: mockTypes.computer,
      computer: { id: 'comp-123' },
    } as unknown as Equipment,

    printer: {
      id: MOCK_EQUIPMENT_ID,
      num_inventario: 'INV-1002',
      description: 'Impresora de prueba',
      status: true,
      id_type_equipment: mockTypes.printer,
      printer: { id: 'print-123' },
    } as unknown as Equipment,

    network: {
      id: MOCK_EQUIPMENT_ID,
      num_inventario: 'INV-1003',
      description: 'Switch de prueba',
      status: true,
      id_type_equipment: mockTypes.network,
      network: { id: 'net-123' },
    } as unknown as Equipment,
  };

  // --- FACTORIES FOR DTOS ---
  const createComputerDtoFactory = (): CreateEquipmentDto => ({
    num_inventario: ' INV-1001 ',
    description: 'PC de oficina',
    id_type_equipment: 1,
    id_model: MOCK_MODEL_ID,
    computer: {
      id_type_equipment_computer: '5a2e81b4-96c2-4d11-8231-1823746de501',
      id_type_storage: '5a2e81b4-96c2-4d11-8231-1823746de502',
      id_type_operating_system: '5a2e81b4-96c2-4d11-8231-1823746de503',
      id_processor: '5a2e81b4-96c2-4d11-8231-1823746de504',
      ram: '16GB',
      capacity_storage: '512GB',
      available_storage: '400GB',
    },
    status: true,
  });

  const createPrinterDtoFactory = (): CreateEquipmentDto => ({
    num_inventario: 'INV-1002',
    description: 'Impresora Láser',
    id_type_equipment: 2,
    id_model: MOCK_MODEL_ID,
    printer: {
      id_type_printing: '5a2e81b4-96c2-4d11-8231-1823746de505',
      id_type_function: '5a2e81b4-96c2-4d11-8231-1823746de506',
      model_toner: 'HP 85A',
      color: true,
    },
    status: true,
  });

  const createNetworkDtoFactory = (): CreateEquipmentDto => ({
    num_inventario: 'INV-1003',
    description: 'Switch Gigabit',
    id_type_equipment: 3,
    id_model: MOCK_MODEL_ID,
    network: {
      id_type_equipment_network: '5a2e81b4-96c2-4d11-8231-1823746de507',
      number_ports: 24,
      PoE: true,
    },
    status: true,
  });

  beforeEach(async () => {
    queryRunnerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        create: jest
          .fn()
          .mockImplementation(
            (_entity: unknown, dto: Record<string, unknown>) => dto,
          ),
        save: jest
          .fn()
          .mockImplementation((entity: any) =>
            Promise.resolve({ id: MOCK_EQUIPMENT_ID, ...entity }),
          ),
        preload: jest.fn(),
      } as unknown as EntityManager,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentsService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            createQueryBuilder: jest.fn(),
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
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
          },
        },
        {
          provide: ComputersService,
          useValue: {
            createWithTransaction: jest
              .fn()
              .mockResolvedValue({ id: 'comp-123' }),
            updateWithTransaction: jest
              .fn()
              .mockResolvedValue({ id: 'comp-123' }),
            findOneByEquipment: jest.fn(),
          },
        },
        {
          provide: PrintersService,
          useValue: {
            createWithTransaction: jest
              .fn()
              .mockResolvedValue({ id: 'print-123' }),
            updateWithTransaction: jest
              .fn()
              .mockResolvedValue({ id: 'print-123' }),
            findOneByEquipment: jest.fn(),
          },
        },
        {
          provide: NetworksService,
          useValue: {
            createWithTransaction: jest
              .fn()
              .mockResolvedValue({ id: 'net-123' }),
            updateWithTransaction: jest
              .fn()
              .mockResolvedValue({ id: 'net-123' }),
            findOneByEquipment: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<EquipmentsService>(EquipmentsService);
    equipmentRepo = module.get(getRepositoryToken(Equipment));
    typeRepo = module.get(getRepositoryToken(Equipmenttype));
    computersService = module.get(ComputersService);
    printersService = module.get(PrintersService);
    networksService = module.get(NetworksService);

    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  /* ========================================================================
     PRUEBAS: CREACIÓN (create)
  ======================================================================== */
  describe('create', () => {
    describe('Flujos exitosos por tipo de equipo', () => {
      it('debe crear un equipo de CÓMPUTO en una transacción', async () => {
        const dto = createComputerDtoFactory();
        typeRepo.findOneBy.mockResolvedValue(mockTypes.computer);
        equipmentRepo.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockEquipments.computer);

        const result = await service.create(dto);

        expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
        expect(computersService.createWithTransaction).toHaveBeenCalledWith(
          queryRunnerMock.manager,
          dto.computer,
          MOCK_EQUIPMENT_ID,
        );
        expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
        expect(queryRunnerMock.release).toHaveBeenCalled();
        expect(result).toEqual(mockEquipments.computer);
      });

      it('debe crear un equipo de IMPRESIÓN en una transacción', async () => {
        const dto = createPrinterDtoFactory();
        typeRepo.findOneBy.mockResolvedValue(mockTypes.printer);
        equipmentRepo.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockEquipments.printer);

        const result = await service.create(dto);

        expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
        expect(printersService.createWithTransaction).toHaveBeenCalledWith(
          queryRunnerMock.manager,
          dto.printer,
          MOCK_EQUIPMENT_ID,
        );
        expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
        expect(queryRunnerMock.release).toHaveBeenCalled();
        expect(result).toEqual(mockEquipments.printer);
      });

      it('debe crear un equipo de RED en una transacción', async () => {
        const dto = createNetworkDtoFactory();
        typeRepo.findOneBy.mockResolvedValue(mockTypes.network);
        equipmentRepo.findOne
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockEquipments.network);

        const result = await service.create(dto);

        expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
        expect(networksService.createWithTransaction).toHaveBeenCalledWith(
          queryRunnerMock.manager,
          dto.network,
          MOCK_EQUIPMENT_ID,
        );
        expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
        expect(queryRunnerMock.release).toHaveBeenCalled();
        expect(result).toEqual(mockEquipments.network);
      });
    });

    describe('Manejo de errores y transacciones', () => {
      it('debe lanzar ConflictException antes de abrir transacción si el inventario ya existe', async () => {
        const dto = createComputerDtoFactory();
        typeRepo.findOneBy.mockResolvedValue(mockTypes.computer);
        equipmentRepo.findOne.mockResolvedValue(mockEquipments.computer);

        await expect(service.create(dto)).rejects.toThrow(ConflictException);
        expect(queryRunnerMock.startTransaction).not.toHaveBeenCalled();
      });

      it('debe ejecutar rollbackTransaction y release si la inserción del sub-servicio falla', async () => {
        const dto = createComputerDtoFactory();
        typeRepo.findOneBy.mockResolvedValue(mockTypes.computer);
        equipmentRepo.findOne.mockResolvedValueOnce(null);
        computersService.createWithTransaction.mockRejectedValueOnce(
          new Error('Error en BD'),
        );

        await expect(service.create(dto)).rejects.toThrow();
        expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
        expect(queryRunnerMock.release).toHaveBeenCalled();
      });
    });
  });

  /* ========================================================================
     PRUEBAS: ACTUALIZACIÓN (update)
  ======================================================================== */
  describe('update', () => {
    describe('Flujos exitosos por tipo de equipo', () => {
      it('debe actualizar CÓMPUTO usando ComputersService.updateWithTransaction', async () => {
        const updateDto: UpdateEquipmentDto = {
          num_inventario: ' INV-1001 ',
          description: 'PC de oficina',
          id_type_equipment: 1,
          id_model: '5a2e81b4-96c2-4d11-8231-1823746de50M',
          computer: {
            id_type_equipment_computer: '5a2e81b4-96c2-4d11-8231-1823746de501',
            id_type_storage: '5a2e81b4-96c2-4d11-8231-1823746de502',
            id_type_operating_system: '5a2e81b4-96c2-4d11-8231-1823746de503',
            id_processor: '5a2e81b4-96c2-4d11-8231-1823746de504',
            ram: '16',
            capacity_storage: '512',
            available_storage: '400',
          },
          status: true,
        };

        equipmentRepo.findOne
          .mockResolvedValueOnce(mockEquipments.computer)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(mockEquipments.computer);

        typeRepo.findOneBy.mockResolvedValue(mockTypes.computer);
        (queryRunnerMock.manager.preload as jest.Mock).mockResolvedValue(
          mockEquipments.computer,
        );
        (queryRunnerMock.manager.save as jest.Mock).mockResolvedValue(
          mockEquipments.computer,
        );

        const result = await service.update(MOCK_EQUIPMENT_ID, updateDto);

        expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
        expect(computersService.updateWithTransaction).toHaveBeenCalledWith(
          queryRunnerMock.manager,
          'comp-123',
          updateDto.computer,
        );
        expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
        expect(queryRunnerMock.release).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('debe actualizar IMPRESIÓN usando PrintersService.updateWithTransaction', async () => {
        const updateDto: UpdateEquipmentDto = {
          printer: {
            id_type_printing: '5a2e81b4-96c2-4d11-8231-1823746de505',
            id_type_function: '5a2e81b4-96c2-4d11-8231-1823746de506',
            model_toner: 'HP 85A',
            color: true,
          },
          status: true,
        };

        equipmentRepo.findOne
          .mockResolvedValueOnce(mockEquipments.printer) // 1. Búsqueda inicial previa a la transacción
          .mockResolvedValueOnce(mockEquipments.printer); // 2. Búsqueda final tras completar la transacción

        typeRepo.findOneBy.mockResolvedValue(mockTypes.printer);
        (queryRunnerMock.manager.preload as jest.Mock).mockResolvedValue(
          mockEquipments.printer,
        );
        (queryRunnerMock.manager.save as jest.Mock).mockResolvedValue(
          mockEquipments.printer,
        );

        const result = await service.update(MOCK_EQUIPMENT_ID, updateDto);

        expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
        expect(printersService.updateWithTransaction).toHaveBeenCalledWith(
          queryRunnerMock.manager,
          'print-123',
          updateDto.printer,
        );
        expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
        expect(queryRunnerMock.release).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('debe actualizar RED usando NetworksService.updateWithTransaction', async () => {
        const updateDto: UpdateEquipmentDto = {
          network: {
            id_type_equipment_network: '5a2e81b4-96c2-4d11-8231-1823746de507',
            number_ports: 24,
            PoE: true,
          },
          status: true,
        };

        equipmentRepo.findOne
          .mockResolvedValueOnce(mockEquipments.network) // 1. Búsqueda inicial previa a la transacción
          .mockResolvedValueOnce(mockEquipments.network); // 2. Búsqueda final tras completar la transacción

        typeRepo.findOneBy.mockResolvedValue(mockTypes.network);
        (queryRunnerMock.manager.preload as jest.Mock).mockResolvedValue(
          mockEquipments.network,
        );
        (queryRunnerMock.manager.save as jest.Mock).mockResolvedValue(
          mockEquipments.network,
        );

        const result = await service.update(MOCK_EQUIPMENT_ID, updateDto);

        expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
        expect(networksService.updateWithTransaction).toHaveBeenCalledWith(
          queryRunnerMock.manager,
          'net-123',
          updateDto.network,
        );
        expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
        expect(queryRunnerMock.release).toHaveBeenCalled();
        expect(result).toBeDefined();
      });
    });

    describe('Manejo de errores y transacciones', () => {
      it('debe hacer rollback y liberar recurso si preload retorna null dentro de la transacción', async () => {
        const updateDto: UpdateEquipmentDto = {
          description: 'Nueva descripción',
        };

        equipmentRepo.findOne.mockResolvedValueOnce(mockEquipments.computer);
        typeRepo.findOneBy.mockResolvedValue(mockTypes.computer);
        (queryRunnerMock.manager.preload as jest.Mock).mockResolvedValue(null);

        await expect(
          service.update(MOCK_EQUIPMENT_ID, updateDto),
        ).rejects.toThrow(NotFoundException);
        expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
        expect(queryRunnerMock.release).toHaveBeenCalled();
      });
    });
  });
});
