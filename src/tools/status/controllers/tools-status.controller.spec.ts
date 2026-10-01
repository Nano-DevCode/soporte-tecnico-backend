import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { UpdateResult } from 'typeorm';
import { ToolsStatusController } from './tools-status.controller';
import { ToolsStatusService } from '../services/tools-status.service';
import { CreateToolsStatusDto } from '../dto/create-tools-status.dto';
import { UpdateToolsStatusDto } from '../dto/update-tools-status.dto';
import { ToolsStatus } from '../entities/tools-status.entity';

describe('ToolsStatusController', () => {
  let controller: ToolsStatusController;
  let service: jest.Mocked<ToolsStatusService>;

  const mockToolsStatusService = {
    create: jest.fn(),
    findAll: jest.fn(),
    seed: jest.fn(),
    update: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsStatusController],
      providers: [
        {
          provide: ToolsStatusService,
          useValue: mockToolsStatusService,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ToolsStatusController>(ToolsStatusController);
    service = module.get(ToolsStatusService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create with dto', async () => {
    const dto: CreateToolsStatusDto = {
      name: 'NUEVO',
      description: 'Estado nuevo',
    };
    const createdStatus = {
      id: '1',
      name: dto.name,
      description: dto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      tools: [],
      movementIn: [],
      movementOut: [],
    } as ToolsStatus;
    mockToolsStatusService.create.mockResolvedValue(createdStatus);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(createdStatus);
  });

  it('should call service.seed', async () => {
    mockToolsStatusService.seed.mockResolvedValue({ complete: true });

    const result = await controller.seed();

    expect(service.seed).toHaveBeenCalled();
    expect(result).toEqual({ complete: true });
  });

  it('should call service.findAll', async () => {
    mockToolsStatusService.findAll.mockResolvedValue({ toolsStatus: [] });

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual({ toolsStatus: [] });
  });

  it('should call service.update with id and dto', async () => {
    const dto: UpdateToolsStatusDto = { name: 'ACTUALIZADO' };
    const updateResult: UpdateResult = {
      affected: 1,
      raw: {},
      generatedMaps: [],
    };
    mockToolsStatusService.update.mockResolvedValue(updateResult);

    const result = await controller.update('status-uuid-1', dto);

    expect(service.update).toHaveBeenCalledWith('status-uuid-1', dto);
    expect(result).toEqual(updateResult);
  });
});
