import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ToolsMovementsOutController } from './tools-movements-out.controller';
import { ToolsMovementsOutService } from '../services/tools-movements-out.service';
import { CreateToolsMovementsOutDto } from '../dto/create-tools-movements-out.dto';

describe('ToolsMovementsOutController', () => {
  let controller: ToolsMovementsOutController;
  let service: jest.Mocked<ToolsMovementsOutService>;

  const mockMovementResponse = {
    id: 'movement-uuid',
    type: 'OUT',
    tool: {
      id: 'tool-uuid',
      inUse: true,
    },
    movementOut: {
      observations: 'Herramienta asignada para mantenimiento de red',
      description: 'Salida a campo',
      voucher: 'VALE-2026',
      id: 'movement-out-uuid',
    },
  } as unknown as Awaited<ReturnType<ToolsMovementsOutService['create']>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsMovementsOutController],
      providers: [
        {
          provide: ToolsMovementsOutService,
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

    controller = module.get<ToolsMovementsOutController>(
      ToolsMovementsOutController,
    );
    service = module.get(ToolsMovementsOutService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO provisto y retornar el resultado', async () => {
      const createDto: CreateToolsMovementsOutDto = {
        toolId: 'tool-uuid',
        toolStatusId: 'status-uuid',
        observations: 'Herramienta asignada para mantenimiento de red',
        description: 'Salida a campo',
        voucher: 'VALE-2026',
        staffId: 'staff-uuid',
        ticketId: 'ticket-uuid',
      };

      service.create.mockResolvedValue(mockMovementResponse);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockMovementResponse);
    });
  });
});
