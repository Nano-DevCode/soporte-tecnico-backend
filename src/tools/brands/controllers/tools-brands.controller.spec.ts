import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { UpdateResult } from 'typeorm';
import { ToolsBrandsController } from './tools-brands.controller';
import { ToolsBrandsService } from '../services/tools-brands.service';
import { CreateToolsBrandDto } from '../dto/create-tools-brand.dto';
import { UpdateToolsBrandDto } from '../dto/update-tools-brand.dto';
import { FilterToolsBrandDto } from '../dto/filter-tools-brand.dto';
import { ToolsBrand } from '../entities/tools-brand.entity';

describe('ToolsBrandsController', () => {
  let controller: ToolsBrandsController;
  let service: jest.Mocked<ToolsBrandsService>;

  const mockToolsBrandsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsBrandsController],
      providers: [
        {
          provide: ToolsBrandsService,
          useValue: mockToolsBrandsService,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ToolsBrandsController>(ToolsBrandsController);
    service = module.get(ToolsBrandsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create with dto', async () => {
    const dto: CreateToolsBrandDto = { name: 'STANLEY' };
    const createdBrand = {
      id: '1',
      name: 'STANLEY',
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    } as ToolsBrand;
    mockToolsBrandsService.create.mockResolvedValue(createdBrand);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(createdBrand);
  });

  it('should call service.findAll with filterDto', async () => {
    const filterDto: FilterToolsBrandDto = { limit: 10, offset: 0 };
    const paginatedResult = {
      toolsBrands: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    };
    mockToolsBrandsService.findAll.mockResolvedValue(paginatedResult);

    const result = await controller.findAll(filterDto);

    expect(service.findAll).toHaveBeenCalledWith(filterDto);
    expect(result.meta.total).toBe(0);
  });

  it('should call service.update with id and dto', async () => {
    const dto: UpdateToolsBrandDto = { name: 'STANLEY FATMAX' };
    const updateResult: UpdateResult = {
      affected: 1,
      raw: {},
      generatedMaps: [],
    };
    mockToolsBrandsService.update.mockResolvedValue(updateResult);

    const result = await controller.update('brand-uuid-1', dto);

    expect(service.update).toHaveBeenCalledWith('brand-uuid-1', dto);
    expect(result).toEqual(updateResult);
  });
});
