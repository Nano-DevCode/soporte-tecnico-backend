import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { UpdateResult } from 'typeorm';
import { ToolsModelsController } from './tools-models.controller';
import { ToolsModelsService } from '../services/tools-models.service';
import { CreateToolsModelDto } from '../dto/create-tools-model.dto';
import { UpdateToolsModelDto } from '../dto/update-tools-model.dto';
import { FilterToolsModelDto } from '../dto/filter-tools-model.dto';
import { ToolsModel } from '../entities/tools-model.entity';

describe('ToolsModelsController', () => {
  let controller: ToolsModelsController;
  let service: jest.Mocked<ToolsModelsService>;

  const mockToolsModelsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsModelsController],
      providers: [
        {
          provide: ToolsModelsService,
          useValue: mockToolsModelsService,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ToolsModelsController>(ToolsModelsController);
    service = module.get(ToolsModelsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create with dto', async () => {
    const dto: CreateToolsModelDto = {
      name: 'MODEL X',
      brandId: 'brand-uuid-1',
    };
    const createdModel = {
      id: '1',
      name: 'MODEL X',
      createdAt: new Date(),
      updatedAt: new Date(),
      brand: {
        id: 'brand-uuid-1',
        name: 'DEWALT',
        createdAt: new Date(),
        updatedAt: new Date(),
        models: [],
      },
      tools: [],
    } as ToolsModel;
    mockToolsModelsService.create.mockResolvedValue(createdModel);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(createdModel);
  });

  it('should call service.findAll with filterDto', async () => {
    const filterDto: FilterToolsModelDto = { limit: 10, offset: 0 };
    const paginatedResult = {
      toolsModels: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    };
    mockToolsModelsService.findAll.mockResolvedValue(paginatedResult);

    const result = await controller.findAll(filterDto);

    expect(service.findAll).toHaveBeenCalledWith(filterDto);
    expect(result.meta.total).toBe(0);
  });

  it('should call service.update with id and dto', async () => {
    const dto: UpdateToolsModelDto = { name: 'UPDATED MODEL' };
    const updateResult: UpdateResult = {
      affected: 1,
      raw: {},
      generatedMaps: [],
    };
    mockToolsModelsService.update.mockResolvedValue(updateResult);

    const result = await controller.update('model-uuid-1', dto);

    expect(service.update).toHaveBeenCalledWith('model-uuid-1', dto);
    expect(result).toEqual(updateResult);
  });
});
