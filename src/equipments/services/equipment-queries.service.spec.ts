import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { EquipmentQueriesService } from './equipment-queries.service';
import { Equipment } from '../entities/equipment.entity';
import { FilterEquipmentDto } from '../dto/filter-equipment.dto';

describe('EquipmentQueriesService', () => {
  let service: EquipmentQueriesService;

  const MOCK_EQUIPMENT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockEquipment = {
    id: MOCK_EQUIPMENT_ID,
    num_inventario: 'INV-100',
    num_serial: 'SN-100',
    description: 'PC de prueba',
    status: true,
    id_type_equipment: { id: 1, name: 'Computadora' },
    id_departament: { id: 'dep-1', name: 'Sistemas' },
    id_model: {
      id: 'mod-1',
      name: 'ThinkPad',
      id_brand: { id: 'br-1', name: 'Lenovo' },
    },
    id_responsable: {
      id: 'resp-1',
      name: 'Juan',
      first_name: 'Pérez',
      last_name: 'Gómez',
    },
    computer: {
      id: 'comp-1',
      ram: '16GB',
      capacity_storage: '512GB',
      id_processor: { brand: 'Intel', model: 'i7' },
      id_type_operating_system: { name: 'Windows 11' },
      id_type_equipment_computer: { name: 'Laptop' },
    },
  } as unknown as Equipment;

  const mockEquipmentRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockI18nService = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentQueriesService,
        { provide: getRepositoryToken(Equipment), useValue: mockEquipmentRepo },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<EquipmentQueriesService>(EquipmentQueriesService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('debe retornar el equipo si existe con un UUID válido', async () => {
      mockEquipmentRepo.findOne.mockResolvedValue(mockEquipment);

      const result = await service.findOne(MOCK_EQUIPMENT_ID);
      expect(result).toEqual(mockEquipment);
      expect(mockEquipmentRepo.findOne).toHaveBeenCalledWith({
        where: { id: MOCK_EQUIPMENT_ID },
        relations: expect.any(Array),
      });
    });

    it('debe lanzar BadRequestException si el id no es UUID válido', async () => {
      await expect(service.findOne('invalid-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar NotFoundException si el equipo no existe', async () => {
      mockEquipmentRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(MOCK_EQUIPMENT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar lista paginada con filtros', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockEquipment], 1]);

      const filterDto: FilterEquipmentDto = {
        query: 'INV',
        status: true,
        category: 'computers',
        id_departament: 'dep-1',
        limit: 10,
        offset: 0,
      };

      const result = await service.findAll(filterDto);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findByType', () => {
    it('debe retornar lista paginada filtrada por tipo numérico', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockEquipment], 1]);

      const filterDto: FilterEquipmentDto = {
        query: 'INV',
        status: true,
        limit: 10,
        offset: 0,
      };

      const result = await service.findByType(1, 'computers', filterDto);
      expect(result.data).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'equipment.id_type_equipment = :typeId',
        { typeId: 1 },
      );
    });
  });

  describe('mapToDto', () => {
    it('debe mapear correctamente para equipo tipo computadora', () => {
      const mapped = service.mapToDto(mockEquipment, 'computer');
      expect(mapped.folio).toBe('INV-100');
      expect(mapped.type).toBe('Computadora');
      expect((mapped as { processor?: string }).processor).toBe('Intel - i7');
      expect((mapped as { ram?: string }).ram).toBe('16GB');
    });

    it('debe mapear correctamente para equipo tipo impresora', () => {
      const printerEquipment = {
        ...mockEquipment,
        id_type_equipment: { id: 2, name: 'Impresora' },
        computer: null,
        printer: {
          id: 'print-1',
          color: true,
          model_toner: 'HP 105A',
          id_type_function: { name: 'Multifuncional' },
          id_type_printing: { name: 'Láser' },
        },
      } as unknown as Equipment;

      const mapped = service.mapToDto(printerEquipment, 'printer');
      expect(mapped.type).toBe('Impresora');
      expect((mapped as { modelToner?: string }).modelToner).toBe('HP 105A');
      expect((mapped as { color?: boolean }).color).toBe(true);
    });

    it('debe mapear correctamente para equipo tipo red', () => {
      const networkEquipment = {
        ...mockEquipment,
        id_type_equipment: { id: 3, name: 'Red' },
        computer: null,
        network: {
          id: 'net-1',
          number_ports: 24,
          PoE: true,
          id_type_equipment_network: { name: 'Switch' },
        },
      } as unknown as Equipment;

      const mapped = service.mapToDto(networkEquipment, 'network');
      expect(mapped.type).toBe('Red');
      expect((mapped as { numberPorts?: number }).numberPorts).toBe(24);
      expect((mapped as { PoE?: boolean }).PoE).toBe(true);
    });
  });
});
