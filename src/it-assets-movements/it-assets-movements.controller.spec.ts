import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

import { ItAssetsMovementsController } from './it-assets-movements.controller';
import { ItAssetsMovementsService } from './it-assets-movements.service';
import { FilterItAssetsMovementsDto } from './dto/filter-it-assets-movements.dto';

describe('ItAssetsMovementsController', () => {
  let controller: ItAssetsMovementsController;
  let service: jest.Mocked<ItAssetsMovementsService>;

  // Mock general de un movimiento
  const mockMovement = {
    id: 'movement-uuid-1',
    type: 'IN',
    itAsset: {
      id: 'asset-uuid-1',
      name: 'Laptop Dell',
    },
    createdAt: new Date(),
  };

  // Mock de la respuesta paginada
  const mockPaginatedResponse = {
    itAssetsMovements: [mockMovement],
    meta: {
      total: 1,
      page: 1,
      lastPage: 1,
    },
  } as unknown as Awaited<ReturnType<ItAssetsMovementsService['findAll']>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItAssetsMovementsController],
      providers: [
        {
          provide: ItAssetsMovementsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
        // 👇 Mocks necesarios para que los Guards del decorador @Auth funcionen en el test
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

    controller = module.get<ItAssetsMovementsController>(
      ItAssetsMovementsController,
    );
    service = module.get(ItAssetsMovementsService);

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
      const filterDto: FilterItAssetsMovementsDto = {
        limit: 10,
        offset: 0,
        query: 'Dell',
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
        mockMovement as Awaited<
          ReturnType<ItAssetsMovementsService['findOne']>
        >,
      );

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockMovement);
    });
  });
});
