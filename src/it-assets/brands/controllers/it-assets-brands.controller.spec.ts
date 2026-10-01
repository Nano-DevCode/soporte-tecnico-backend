import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ItAssetsBrandsController } from './it-assets-brands.controller';
import { ItAssetsBrandsService } from '../services/it-assets-brands.service';
import { CreateItAssetsBrandDto } from '../dto/create-it-assets-brand.dto';
import { UpdateItAssetsBrandDto } from '../dto/update-it-assets-brand.dto';
import { FilterItAssetsBrandDto } from '../dto/filter-it-assets-brand.dto';

describe('ItAssetsBrandsController', () => {
  let controller: ItAssetsBrandsController;
  let service: jest.Mocked<ItAssetsBrandsService>;

  const mockBrand = {
    id: 'brand-uuid-1',
    name: 'DELL',
    createdAt: new Date(),
    updatedAt: new Date(),
    models: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItAssetsBrandsController],
      providers: [
        {
          provide: ItAssetsBrandsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
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

    controller = module.get<ItAssetsBrandsController>(ItAssetsBrandsController);
    service = module.get(ItAssetsBrandsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe crear una marca', async () => {
      const dto: CreateItAssetsBrandDto = { name: 'DELL' };
      service.create.mockResolvedValue(mockBrand);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockBrand);
    });
  });

  describe('findAll', () => {
    it('debe retornar marcas con paginación', async () => {
      const filterDto: FilterItAssetsBrandDto = { limit: 10, offset: 0 };
      const paginatedResult = {
        itAssetsBrands: [mockBrand],
        meta: { total: 1, page: 1, lastPage: 1 },
      };
      service.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('update', () => {
    it('debe actualizar una marca', async () => {
      const dto: UpdateItAssetsBrandDto = { name: 'HP' };
      const updateResult = { generatedMaps: [], raw: [], affected: 1 };
      service.update.mockResolvedValue(updateResult);

      const result = await controller.update('brand-uuid-1', dto);

      expect(service.update).toHaveBeenCalledWith('brand-uuid-1', dto);
      expect(result).toEqual(updateResult);
    });
  });
});
