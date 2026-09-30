import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

import { ToolsMovementsController } from './tools-movements.controller';
import { ToolsMovementsService } from './tools-movements.service';
import { FilterToolsMovementsDto } from './dto/filter-tools-movements.dto';

describe('ToolsMovementsController', () => {
  let controller: ToolsMovementsController;
  let service: jest.Mocked<ToolsMovementsService>;

  // Mock general de un movimiento (Entrada o Salida)
  const mockMovement = {
    id: 'movement-uuid-1',
    type: 'IN',
    tool: {
      id: 'tool-uuid-1',
      name: 'Taladro Bosch',
    },
    createdAt: new Date(),
  };

  // Mock de la respuesta paginada del findAll
  const mockPaginatedResponse = {
    toolsMovements: [mockMovement],
    meta: {
      total: 1,
      page: 1,
      lastPage: 1,
    },
  } as unknown as Awaited<ReturnType<ToolsMovementsService['findAll']>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsMovementsController],
      providers: [
        {
          provide: ToolsMovementsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
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

    controller = module.get<ToolsMovementsController>(ToolsMovementsController);
    service = module.get(ToolsMovementsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /* ========================================================================
     FIND ALL
  ======================================================================== */
  describe('findAll', () => {
    it('debe llamar a service.findAll con los filtros y retornar el resultado paginado', async () => {
      const filterDto: FilterToolsMovementsDto = {
        limit: 10,
        offset: 0,
        query: 'Taladro',
        type: 'IN' as FilterToolsMovementsDto['type'],
      };

      service.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  /* ========================================================================
     FIND ONE
  ======================================================================== */
  describe('findOne', () => {
    it('debe llamar a service.findOne con el ID provisto y retornar el detalle del movimiento', async () => {
      const id = 'movement-uuid-1';

      service.findOne.mockResolvedValue(
        mockMovement as Awaited<ReturnType<ToolsMovementsService['findOne']>>,
      );

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockMovement);
    });
  });
});
