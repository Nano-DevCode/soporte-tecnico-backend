import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ModelsService } from './models.service';
import { Model } from './entities/model.entity';
import { Brand } from '../brands/entities/brand.entity';
import { CreateModelDto } from './dto/create-model.dto';

describe('ModelsService', () => {
  let service: ModelsService;

  const mockBrand = {
    id: 'f8c3d81b-96c2-4d11-8231-1823746de552',
    name: 'Dell',
  } as Brand;

  const mockModel = {
    id: '3b9e81b4-96c2-4d11-8231-1823746de941',
    name: 'Latitude 5420',
    id_brand: mockBrand,
  } as Model;

  const mockModelRepo = {
    findOne: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((dto) => Promise.resolve({ id: mockModel.id, ...dto })),
    findAndCount: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
  };

  const mockBrandRepo = {
    findOneBy: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        { provide: getRepositoryToken(Model), useValue: mockModelRepo },
        { provide: getRepositoryToken(Brand), useValue: mockBrandRepo },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('create debe crear un modelo si la marca existe y no está duplicado', async () => {
    mockBrandRepo.findOneBy.mockResolvedValue(mockBrand);
    mockModelRepo.findOne.mockResolvedValue(null);

    const dto: CreateModelDto = {
      name: 'Latitude 5420',
      id_brand: mockBrand.id,
    };

    const result = await service.create(dto);
    expect(result.name).toBe('Latitude 5420');
    expect(mockModelRepo.save).toHaveBeenCalled();
  });

  it('create debe lanzar NotFoundException si la marca no existe', async () => {
    mockBrandRepo.findOneBy.mockResolvedValue(null);

    const dto: CreateModelDto = {
      name: 'Latitude 5420',
      id_brand: mockBrand.id,
    };

    await expect(service.create(dto)).rejects.toThrow(NotFoundException);
  });

  it('create debe lanzar ConflictException si el modelo ya existe para esa marca', async () => {
    mockBrandRepo.findOneBy.mockResolvedValue(mockBrand);
    mockModelRepo.findOne.mockResolvedValue(mockModel);

    const dto: CreateModelDto = {
      name: 'Latitude 5420',
      id_brand: mockBrand.id,
    };

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });
});
