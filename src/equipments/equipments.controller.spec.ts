import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { EquipmentsController } from './equipments.controller';
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { Equipment } from './entities/equipment.entity';
import { I18nService } from 'nestjs-i18n';

describe('EquipmentsController', () => {
  let controller: EquipmentsController;
  let service: jest.Mocked<EquipmentsService>;

  // --- MOCK SERVICES & GUARDS PROVIDERS ---
  const mockI18nService = {
    translate: jest.fn().mockImplementation((key: string) => key),
    t: jest.fn().mockImplementation((key: string) => key),
  };

  // --- CONSTANTES Y MOCK DATA FIXTURES ---
  const MOCK_EQUIPMENT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const MOCK_MODEL_ID = '5a2e81b4-96c2-4d11-8231-1823746de50M';

  const mockTypes = {
    computer: { id: 1, name: 'Computadora' },
    printer: { id: 2, name: 'Impresora' },
    network: { id: 3, name: 'Red' },
  };

  const mockEquipments: Record<'computer' | 'printer' | 'network', Equipment> =
    {
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentsController],
      providers: [
        {
          provide: EquipmentsService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        // Proveemos Reflector y el Mock de I18nService requeridos por UserRoleGuard
        Reflector,
        {
          provide: I18nService, // Ajusta 'I18nService' según la clase o token exacta usada en tu proyecto (ej. I18nService de nestjs-i18n)
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<EquipmentsController>(EquipmentsController);
    service = module.get(EquipmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  /* ========================================================================
     ENDPOINT: POST /equipments (create)
  ======================================================================== */
  describe('create', () => {
    describe('Flujos exitosos por tipo de equipo', () => {
      it('debe delegar la creación de una COMPUTADORA al servicio y retornar el equipo creado', async () => {
        const dto = createComputerDtoFactory();
        service.create.mockResolvedValue(mockEquipments.computer);

        const result = await controller.create(dto);

        expect(service.create).toHaveBeenCalledTimes(1);
        expect(service.create).toHaveBeenCalledWith(dto);
        expect(result).toEqual(mockEquipments.computer);
      });

      it('debe delegar la creación de una IMPRESORA al servicio y retornar el equipo creado', async () => {
        const dto = createPrinterDtoFactory();
        service.create.mockResolvedValue(mockEquipments.printer);

        const result = await controller.create(dto);

        expect(service.create).toHaveBeenCalledTimes(1);
        expect(service.create).toHaveBeenCalledWith(dto);
        expect(result).toEqual(mockEquipments.printer);
      });

      it('debe delegar la creación de un equipo de RED al servicio y retornar el equipo creado', async () => {
        const dto = createNetworkDtoFactory();
        service.create.mockResolvedValue(mockEquipments.network);

        const result = await controller.create(dto);

        expect(service.create).toHaveBeenCalledTimes(1);
        expect(service.create).toHaveBeenCalledWith(dto);
        expect(result).toEqual(mockEquipments.network);
      });
    });

    describe('Manejo de errores', () => {
      it('debe propagar ConflictException cuando el número de inventario ya existe', async () => {
        const dto = createComputerDtoFactory();
        service.create.mockRejectedValue(
          new ConflictException('El número de inventario ya existe'),
        );

        await expect(controller.create(dto)).rejects.toThrow(ConflictException);
        expect(service.create).toHaveBeenCalledTimes(1);
        expect(service.create).toHaveBeenCalledWith(dto);
      });
    });
  });

  /* ========================================================================
     ENDPOINT: PATCH /equipments/:id (update)
  ======================================================================== */
  describe('update', () => {
    describe('Flujos exitosos por tipo de equipo', () => {
      it('debe delegar la actualización de CÓMPUTO al servicio', async () => {
        const updateDto: UpdateEquipmentDto = {
          description: 'PC de oficina actualizada',
          computer: {
            ram: '32GB',
            id_type_equipment_computer: 'abcd1234-5678-90ab-cdef-1234567890ab',
            id_type_storage: 'efgh5678-9012-3456-7890-1234567890cd',
            id_type_operating_system: 'ijkl9012-3456-7890-1234-5678901234ef',
            id_processor: 'mnop3456-7890-1234-5678-901234567890',
            capacity_storage: '57',
            available_storage: '500',
          },
        };
        service.update.mockResolvedValue(
          mockEquipments.computer as unknown as Awaited<
            ReturnType<EquipmentsService['update']>
          >,
        );

        const result = await controller.update(MOCK_EQUIPMENT_ID, updateDto);

        expect(service.update).toHaveBeenCalledTimes(1);
        expect(service.update).toHaveBeenCalledWith(
          MOCK_EQUIPMENT_ID,
          updateDto,
        );
        expect(result).toEqual(mockEquipments.computer);
      });

      it('debe delegar la actualización de IMPRESIÓN al servicio', async () => {
        const updateDto: UpdateEquipmentDto = {
          printer: {
            model_toner: 'HP 85A V2',
            id_type_printing: 'acde1234-5678-90ab-cdef-1234567890ab',
            id_type_function: 'efgh5678-9012-3456-7890-1234567890cd',
            color: false,
          },
        };
        service.update.mockResolvedValue(
          mockEquipments.printer as unknown as Awaited<
            ReturnType<EquipmentsService['update']>
          >,
        );

        const result = await controller.update(MOCK_EQUIPMENT_ID, updateDto);

        expect(service.update).toHaveBeenCalledTimes(1);
        expect(service.update).toHaveBeenCalledWith(
          MOCK_EQUIPMENT_ID,
          updateDto,
        );
        expect(result).toEqual(mockEquipments.printer);
      });

      it('debe delegar la actualización de RED al servicio', async () => {
        const updateDto: UpdateEquipmentDto = {
          network: {
            number_ports: 48,
            id_type_equipment_network: 'ijkl9012-3456-7890-1234-5678901234ef',
            PoE: false,
          },
        };
        service.update.mockResolvedValue(
          mockEquipments.network as unknown as Awaited<
            ReturnType<EquipmentsService['update']>
          >,
        );

        const result = await controller.update(MOCK_EQUIPMENT_ID, updateDto);

        expect(service.update).toHaveBeenCalledTimes(1);
        expect(service.update).toHaveBeenCalledWith(
          MOCK_EQUIPMENT_ID,
          updateDto,
        );
        expect(result).toEqual(mockEquipments.network);
      });
    });

    describe('Manejo de errores', () => {
      it('debe propagar NotFoundException si el equipo a actualizar no existe', async () => {
        const updateDto: UpdateEquipmentDto = {
          description: 'Nueva descripción',
        };
        service.update.mockRejectedValue(
          new NotFoundException('Equipo no encontrado'),
        );

        await expect(
          controller.update(MOCK_EQUIPMENT_ID, updateDto),
        ).rejects.toThrow(NotFoundException);
        expect(service.update).toHaveBeenCalledTimes(1);
        expect(service.update).toHaveBeenCalledWith(
          MOCK_EQUIPMENT_ID,
          updateDto,
        );
      });
    });
  });
});
