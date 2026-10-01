import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ToolsMovementsInController } from './tools-movements-in.controller';
import { ToolsMovementsInService } from '../services/tools-movements-in.service';
import { CreateToolsMovementsInDto } from '../dto/create-tools-movements-in.dto';

describe('ToolsMovementsInController', () => {
  let controller: ToolsMovementsInController;
  let service: jest.Mocked<ToolsMovementsInService>;

  const mockMovementResponse = {
    id: 'movement-uuid',
    type: 'IN',
    tool: {
      id: 'tool-uuid',
      inUse: false,
    },
    movementIn: {
      observations: 'La herramienta regresó en buen estado',
      id: 'movement-in-uuid',
    },
  } as unknown as Awaited<ReturnType<ToolsMovementsInService['create']>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsMovementsInController],
      providers: [
        {
          provide: ToolsMovementsInService,
          useValue: {
            create: jest.fn(),
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

    controller = module.get<ToolsMovementsInController>(
      ToolsMovementsInController,
    );
    service = module.get(ToolsMovementsInService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO provisto y retornar el resultado', async () => {
      const createDto: CreateToolsMovementsInDto = {
        toolId: 'tool-uuid',
        toolsStatusId: 'status-uuid',
        observations: 'La herramienta regresó en buen estado',
      };

      service.create.mockResolvedValue(mockMovementResponse);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockMovementResponse);
    });
  });
});
