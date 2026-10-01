import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ItAssetsModelsController } from './it-assets-models.controller';
import { ItAssetsModelsService } from '../services/it-assets-models.service';
import { CreateItAssetsModelDto } from '../dto/create-it-assets-model.dto';
import { UpdateItAssetsModelDto } from '../dto/update-it-assets-model.dto';
import { FilterItAssetsModelDto } from '../dto/filter-it-assets-model.dto';

describe('ItAssetsModelsController', () => {
  let controller: ItAssetsModelsController;
  let service: jest.Mocked<ItAssetsModelsService>;

  const mockModel = {
    id: 'model-uuid-1',
    name: 'LATITUDE 5420',
    createdAt: new Date(),
    updatedAt: new Date(),
    brand: {
      id: 'brand-uuid-1',
      name: 'DELL',
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [],
    },
    itAssets: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItAssetsModelsController],
      providers: [
        {
          provide: ItAssetsModelsService,
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

    controller = module.get<ItAssetsModelsController>(ItAssetsModelsController);
    service = module.get(ItAssetsModelsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un modelo', async () => {
      const dto: CreateItAssetsModelDto = {
        name: 'LATITUDE 5420',
        brandId: 'brand-uuid-1',
      };
      service.create.mockResolvedValue(mockModel);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockModel);
    });
  });

  describe('findAll', () => {
    it('debe retornar modelos con paginación', async () => {
      const filterDto: FilterItAssetsModelDto = { limit: 10, offset: 0 };
      const paginatedResult = {
        itAssetsModels: [mockModel],
        meta: { total: 1, page: 1, lastPage: 1 },
      };
      service.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('update', () => {
    it('debe actualizar un modelo', async () => {
      const dto: UpdateItAssetsModelDto = { name: 'LATITUDE 5430' };
      service.update.mockResolvedValue(mockModel);

      const result = await controller.update('model-uuid-1', dto);

      expect(service.update).toHaveBeenCalledWith('model-uuid-1', dto);
      expect(result).toEqual(mockModel);
    });
  });
});
