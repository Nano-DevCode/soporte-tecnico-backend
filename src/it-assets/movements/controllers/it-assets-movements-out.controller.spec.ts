import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ItAssetsMovementsOutController } from './it-assets-movements-out.controller';
import { ItAssetsMovementsOutService } from '../services/it-assets-movements-out.service';
import { CreateItAssetsMovementsOutDto } from '../dto/create-it-assets-movements-out.dto';
import { MovementType } from '../entities/it-assets-movement.entity';

describe('ItAssetsMovementsOutController', () => {
  let controller: ItAssetsMovementsOutController;
  let service: jest.Mocked<ItAssetsMovementsOutService>;

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

  describe('create', () => {
    it('debe registrar un movimiento de salida exitosamente', async () => {
      const dto: CreateItAssetsMovementsOutDto = {
        itAssetId: 'asset-uuid',
        itAssetsStatusId: 'status-uuid',
        observations: 'Salida a campo para mantenimiento',
        description: 'Préstamo temporal',
        voucher: 'VALE-001',
        staffId: 'staff-uuid',
        ticketId: 'ticket-uuid',
      };

      service.create.mockResolvedValue(mockMovementResponse);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockMovementResponse);
    });
  });
});
