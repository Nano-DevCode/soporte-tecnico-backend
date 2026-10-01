import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { UpdateResult } from 'typeorm';
import { ToolsTypesController } from './tools-types.controller';
import { ToolsTypesService } from '../services/tools-types.service';
import { CreateToolsTypeDto } from '../dto/create-tools-type.dto';
import { UpdateToolsTypeDto } from '../dto/update-tools-type.dto';
import { FilterToolsTypeDto } from '../dto/filter-tools-type.dto';
import { ToolsType } from '../entities/tools-type.entity';

describe('ToolsTypesController', () => {
  let controller: ToolsTypesController;
  let service: jest.Mocked<ToolsTypesService>;

  const mockToolsTypesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsTypesController],
      providers: [
        {
          provide: ToolsTypesService,
          useValue: mockToolsTypesService,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ToolsTypesController>(ToolsTypesController);
    service = module.get(ToolsTypesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create with dto', async () => {
    const dto: CreateToolsTypeDto = { name: 'CORTE' };
    const createdType = {
      id: '1',
      name: 'CORTE',
      createdAt: new Date(),
      updatedAt: new Date(),
      tools: [],
    } as ToolsType;
    mockToolsTypesService.create.mockResolvedValue(createdType);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(createdType);
  });

  it('should call service.findAll with filterDto', async () => {
    const filterDto: FilterToolsTypeDto = { limit: 10, offset: 0 };
    const paginatedResponse = {
      toolsTypes: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    };
    mockToolsTypesService.findAll.mockResolvedValue(paginatedResponse);

    const result = await controller.findAll(filterDto);

    expect(service.findAll).toHaveBeenCalledWith(filterDto);
    expect(result.meta.total).toBe(0);
  });

  it('should call service.update with id and dto', async () => {
    const dto: UpdateToolsTypeDto = { name: 'CORTE LASER' };
    const updateResult: UpdateResult = {
      affected: 1,
      raw: {},
      generatedMaps: [],
    };
    mockToolsTypesService.update.mockResolvedValue(updateResult);

    const result = await controller.update('type-uuid-1', dto);

    expect(service.update).toHaveBeenCalledWith('type-uuid-1', dto);
    expect(result).toEqual(updateResult);
  });
});
