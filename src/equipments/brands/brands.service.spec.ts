import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';

describe('BrandsService', () => {
  let service: BrandsService;

  const mockBrand = {
    id: 'f8c3d81b-96c2-4d11-8231-1823746de552',
    name: 'Dell',
  } as Brand;

  const mockBrandRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((dto) => Promise.resolve({ id: mockBrand.id, ...dto })),
    findAndCount: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: getRepositoryToken(Brand), useValue: mockBrandRepo },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('create debe crear una marca si el nombre es válido y no existe', async () => {
    mockBrandRepo.findOne.mockResolvedValue(null);
    const dto: CreateBrandDto = { name: 'Dell' };

    const result = await service.create(dto);
    expect(result.name).toBe('Dell');
    expect(mockBrandRepo.save).toHaveBeenCalled();
  });

  it('create debe lanzar ConflictException si la marca ya existe', async () => {
    mockBrandRepo.findOne.mockResolvedValue(mockBrand);
    const dto: CreateBrandDto = { name: 'Dell' };

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('findOne debe retornar la marca si existe', async () => {
    mockBrandRepo.findOneBy.mockResolvedValue(mockBrand);

    const result = await service.findOne(mockBrand.id);
    expect(result).toEqual(mockBrand);
  });

  it('findOne debe lanzar NotFoundException si no existe', async () => {
    mockBrandRepo.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(mockBrand.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
