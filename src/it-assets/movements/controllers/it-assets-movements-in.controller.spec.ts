import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ItAssetsMovementsInController } from './it-assets-movements-in.controller';
import { ItAssetsMovementsInService } from '../services/it-assets-movements-in.service';
import { CreateItAssetsMovementsInDto } from '../dto/create-it-assets-movements-in.dto';
import {
  ItAssetsMovement,
  MovementType,
} from '../entities/it-assets-movement.entity';
import { ItAssetsStatus } from 'src/it-assets/status/entities/it-assets-status.entity';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';

describe('ItAssetsMovementsInController', () => {
  let controller: ItAssetsMovementsInController;
  let service: jest.Mocked<ItAssetsMovementsInService>;

  const mockMovementResponse = {
    id: 'movement-uuid',
    type: MovementType.IN,
    itAsset: {
      id: 'asset-uuid',
      idInventary: '',
      serialNumber: '',
      status: false,
      inUse: false,
      description: '',
      name: '',
      imageUrl: '',
      movements: [],
    } as unknown as ItAsset,
    movementIn: {
      observations: 'El equipo regresó en buen estado',
      id: '',
      movement: new ItAssetsMovement(),
      itAssetsStatus: new ItAssetsStatus(),
    },
  } as unknown as Awaited<ReturnType<ItAssetsMovementsInService['create']>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItAssetsMovementsInController],
      providers: [
        {
          provide: ItAssetsMovementsInService,
          useValue: {
            create: jest.fn(),
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

    controller = module.get<ItAssetsMovementsInController>(
      ItAssetsMovementsInController,
    );
    service = module.get(ItAssetsMovementsInService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe registrar un movimiento de entrada exitosamente', async () => {
      const dto: CreateItAssetsMovementsInDto = {
        itAssetId: 'asset-uuid',
        itAssetsStatusId: 'status-uuid',
        observations: 'El equipo regresó en buen estado',
      };

      service.create.mockResolvedValue(mockMovementResponse);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockMovementResponse);
    });
  });

  describe('findOne', () => {
    it('debe buscar y retornar un movimiento de entrada por ID', async () => {
      const id = 'movement-uuid';
      service.findOne.mockResolvedValue(mockMovementResponse);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockMovementResponse);
    });
  });
});
