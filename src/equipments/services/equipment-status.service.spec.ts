import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { EquipmentStatusService } from './equipment-status.service';
import { EquipmentQueriesService } from './equipment-queries.service';
import { Equipment } from '../entities/equipment.entity';

describe('EquipmentStatusService', () => {
  let service: EquipmentStatusService;

  const mockEquipment = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    num_inventario: 'INV-100',
    status: true,
  } as Equipment;

  const mockEquipmentRepo = {
    save: jest.fn(),
  };

  const mockQueriesService = {
    findOne: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentStatusService,
        { provide: getRepositoryToken(Equipment), useValue: mockEquipmentRepo },
        { provide: EquipmentQueriesService, useValue: mockQueriesService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<EquipmentStatusService>(EquipmentStatusService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('activate debe cambiar status a true', async () => {
    mockQueriesService.findOne.mockResolvedValue({
      ...mockEquipment,
      status: false,
    });
    mockEquipmentRepo.save.mockImplementation((eq) => Promise.resolve(eq));

    const result = await service.activate(mockEquipment.id);
    expect(mockQueriesService.findOne).toHaveBeenCalledWith(mockEquipment.id);
    expect(mockEquipmentRepo.save).toHaveBeenCalled();
    expect(result).toEqual({
      id: mockEquipment.id,
      status: true,
      updated: true,
    });
  });

  it('deactivate debe cambiar status a false', async () => {
    mockQueriesService.findOne.mockResolvedValue({
      ...mockEquipment,
      status: true,
    });
    mockEquipmentRepo.save.mockImplementation((eq) => Promise.resolve(eq));

    const result = await service.deactivate(mockEquipment.id);
    expect(mockQueriesService.findOne).toHaveBeenCalledWith(mockEquipment.id);
    expect(mockEquipmentRepo.save).toHaveBeenCalled();
    expect(result).toEqual({
      id: mockEquipment.id,
      status: false,
      updated: true,
    });
  });

  it('debe manejar error 23505 (conflicto duplicado)', async () => {
    mockQueriesService.findOne.mockResolvedValue({ ...mockEquipment });
    mockEquipmentRepo.save.mockRejectedValue({
      code: '23505',
      detail: 'Key (num_inventario)=(INV-100) already exists.',
    });

    await expect(service.activate(mockEquipment.id)).rejects.toThrow(
      ConflictException,
    );
  });

  it('debe manejar error 23503 (violación de clave foránea)', async () => {
    mockQueriesService.findOne.mockResolvedValue({ ...mockEquipment });
    mockEquipmentRepo.save.mockRejectedValue({ code: '23503' });

    await expect(service.activate(mockEquipment.id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe manejar otros errores de base de datos como InternalServerErrorException', async () => {
    mockQueriesService.findOne.mockResolvedValue({ ...mockEquipment });
    mockEquipmentRepo.save.mockRejectedValue(new Error('Unknown DB Error'));

    await expect(service.activate(mockEquipment.id)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
