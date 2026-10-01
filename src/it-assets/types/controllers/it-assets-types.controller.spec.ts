import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ItAssetsTypesController } from './it-assets-types.controller';
import { ItAssetsTypesService } from '../services/it-assets-types.service';
import { CreateItAssetsTypeDto } from '../dto/create-it-assets-type.dto';
import { UpdateItAssetsTypeDto } from '../dto/update-it-assets-type.dto';
import { FilterItAssetsTypeDto } from '../dto/filter-it-assets-type.dto';

describe('ItAssetsTypesController', () => {
  let controller: ItAssetsTypesController;
  let service: jest.Mocked<ItAssetsTypesService>;

  const mockType = {
    id: 'type-uuid-1',
    name: 'MONITOR',
    createdAt: new Date(),
    updatedAt: new Date(),
    itAssets: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItAssetsTypesController],
      providers: [
        {
          provide: ItAssetsTypesService,
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

    controller = module.get<ItAssetsTypesController>(ItAssetsTypesController);
    service = module.get(ItAssetsTypesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe registrar un nuevo tipo de activo', async () => {
      const dto: CreateItAssetsTypeDto = { name: 'MONITOR' };
      service.create.mockResolvedValue(mockType);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockType);
    });
  });

  describe('findAll', () => {
    it('debe listar tipos de activos', async () => {
      const filterDto: FilterItAssetsTypeDto = { limit: 10, offset: 0 };
      const response = {
        itAssetsTypes: [mockType],
        meta: { total: 1, page: 1, lastPage: 1 },
      };
      service.findAll.mockResolvedValue(response);

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(response);
    });
  });

  describe('update', () => {
    it('debe actualizar un tipo de activo', async () => {
      const dto: UpdateItAssetsTypeDto = { name: 'LAPTOP' };
      const updateResult = { generatedMaps: [], raw: [], affected: 1 };
      service.update.mockResolvedValue(updateResult);

      const result = await controller.update('type-uuid-1', dto);

      expect(service.update).toHaveBeenCalledWith('type-uuid-1', dto);
      expect(result).toEqual(updateResult);
    });
  });
});
