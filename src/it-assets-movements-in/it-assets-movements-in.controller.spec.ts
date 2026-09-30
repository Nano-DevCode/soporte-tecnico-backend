import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

import { ItAssetsMovementsInController } from './it-assets-movements-in.controller';
import { ItAssetsMovementsInService } from './it-assets-movements-in.service';
import { CreateItAssetsMovementsInDto } from './dto/create-it-assets-movements-in.dto';
import {
  ItAssetsMovement,
  MovementType, // 👈 Importamos el Enum
} from 'src/it-assets-movements/entities/it-assets-movement.entity';
import { ItAssetsStatus } from 'src/it-assets-status/entities/it-assets-status.entity';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';

describe('ItAssetsMovementsInController', () => {
  let controller: ItAssetsMovementsInController;
  let service: jest.Mocked<ItAssetsMovementsInService>;

  // Mock de la respuesta del servicio
  const mockMovementResponse = {
    id: 'movement-uuid',
    type: MovementType.IN, // 👈 Usamos el Enum
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
    } as unknown as ItAsset, // 👈 Casteamos a ItAsset para evitar las propiedades faltantes
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

  /* ========================================================================
     CREATE
  ======================================================================== */
  describe('create', () => {
    it('debe llamar a service.create con el DTO provisto y retornar el resultado', async () => {
      const createDto: CreateItAssetsMovementsInDto = {
        itAssetId: 'asset-uuid',
        itAssetsStatusId: 'status-uuid',
        observations: 'El equipo regresó en buen estado',
      };

      service.create.mockResolvedValue(mockMovementResponse);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockMovementResponse);
    });
  });

  /* ========================================================================
     FIND ONE
  ======================================================================== */
  describe('findOne', () => {
    it('debe llamar a service.findOne con el ID provisto y retornar el resultado', async () => {
      const id = 'movement-uuid';

      service.findOne.mockResolvedValue(mockMovementResponse);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockMovementResponse);
    });
  });
});
