import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

import { ItAssetsMovementsOutController } from './it-assets-movements-out.controller';
import { ItAssetsMovementsOutService } from './it-assets-movements-out.service';
import { CreateItAssetsMovementsOutDto } from './dto/create-it-assets-movements-out.dto';
import { MovementType } from 'src/it-assets-movements/entities/it-assets-movement.entity';

describe('ItAssetsMovementsOutController', () => {
  let controller: ItAssetsMovementsOutController;
  let service: jest.Mocked<ItAssetsMovementsOutService>;

  // Mock de la respuesta del servicio
  const mockMovementResponse = {
    id: 'movement-uuid',
    type: MovementType.OUT,
    itAsset: {
      id: 'asset-uuid',
      inUse: true,
    },
    movementOut: {
      observations: 'Salida a campo para mantenimiento',
      id: 'movement-out-uuid',
    },
  } as unknown as Awaited<ReturnType<ItAssetsMovementsOutService['create']>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItAssetsMovementsOutController],
      providers: [
        {
          provide: ItAssetsMovementsOutService,
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

    controller = module.get<ItAssetsMovementsOutController>(
      ItAssetsMovementsOutController,
    );
    service = module.get(ItAssetsMovementsOutService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /* ========================================================================
     CREATE
  ======================================================================== */
  describe('create', () => {
    it('debe llamar a service.create con el DTO provisto y retornar el resultado', async () => {
      const createDto: CreateItAssetsMovementsOutDto = {
        itAssetId: 'asset-uuid',
        itAssetsStatusId: 'status-uuid',
        observations: 'Salida a campo para mantenimiento',
        description: 'Reparación de pantalla',
        voucher: 'VALE-1020',
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
