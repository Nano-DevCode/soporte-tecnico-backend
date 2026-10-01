import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ItAssetsMovementsInService } from './it-assets-movements-in.service';
import { CreateItAssetsMovementsInDto } from '../dto/create-it-assets-movements-in.dto';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';
import {
  ItAssetsMovement,
  MovementType,
} from '../entities/it-assets-movement.entity';

describe('ItAssetsMovementsInService', () => {
  let service: ItAssetsMovementsInService;

  type MockEntityManager = {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const mockEntityManager: MockEntityManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAsset = {
    id: 'asset-uuid',
    inUse: true,
    itAssetStatus: { id: 'status-old' },
  } as ItAsset;

  const createDto: CreateItAssetsMovementsInDto = {
    itAssetId: 'asset-uuid',
    itAssetsStatusId: 'status-new',
    observations: 'Regresa el equipo de mantenimiento',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItAssetsMovementsInService,
        {
          provide: DataSource,
          useValue: {
            transaction: jest
              .fn()
              .mockImplementation(
                async <T>(
                  cb: (manager: EntityManager) => Promise<T>,
                ): Promise<T> => {
                  return await cb(
                    mockEntityManager as unknown as EntityManager,
                  );
                },
              ),
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

    service = module.get<ItAssetsMovementsInService>(
      ItAssetsMovementsInService,
    );

    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe registrar la entrada correctamente, actualizando el activo a inUse=false y creando el movimiento', async () => {
      mockEntityManager.findOne.mockResolvedValue({ ...mockAsset });
      mockEntityManager.save.mockResolvedValueOnce({});
      const newMovement = { id: 'movement-uuid', type: MovementType.IN };
      mockEntityManager.create.mockReturnValue(newMovement);
      mockEntityManager.save.mockResolvedValueOnce(newMovement);

      const result = await service.create(createDto);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(ItAsset, {
        where: { id: createDto.itAssetId },
      });
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(
        1,
        ItAsset,
        expect.objectContaining({
          inUse: false,
          itAssetStatus: { id: 'status-new' },
        }),
      );
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        ItAssetsMovement,
        expect.objectContaining({
          type: MovementType.IN,
          movementIn: expect.objectContaining({
            itAssetsStatus: { id: 'status-new' },
            observations: 'Regresa el equipo de mantenimiento',
          }) as unknown,
        }),
      );
      expect(result).toEqual(newMovement);
    });

    it('debe lanzar BadRequestException si el activo no existe', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.itAssets.movementsIn.assetNotFound',
      );
    });

    it('debe lanzar ConflictException si el activo YA ESTÁ en inventario (inUse: false)', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        ...mockAsset,
        inUse: false,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.itAssets.movementsIn.alreadyInInventory',
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar el movimiento si existe', async () => {
      const mockMovement = { id: 'movement-uuid', type: MovementType.IN };
      mockEntityManager.findOne.mockResolvedValue(mockMovement);

      const result = await service.findOne('movement-uuid');

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(ItAssetsMovement, {
        where: { id: 'movement-uuid' },
      });
      expect(result).toEqual(mockMovement);
    });

    it('debe lanzar NotFoundException si el movimiento no existe', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'errors.itAssets.movementsIn.notFound',
      );
    });
  });

  describe('handleDBExeptions (lanzados indirectamente a través del catch)', () => {
    beforeEach(() => {
      mockEntityManager.findOne.mockImplementation(() => ({
        ...mockAsset,
      }));
    });

    it('debe relanzar errores HttpException nativos', async () => {
      const httpError = new BadRequestException('Error pre-existente');
      mockEntityManager.save.mockRejectedValue(httpError);

      await expect(service.create(createDto)).rejects.toThrow(httpError);
    });

    it('debe lanzar ConflictException en error 23505', async () => {
      const dbError = { code: '23505', detail: 'Llave duplicada de prueba' };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Llave duplicada de prueba',
      );
    });

    it('debe lanzar ConflictException si falla la foránea del Estado (23503)', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (itAssetStatusId)=(...) no existe',
      };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.itAssets.movementsIn.statusNotFound',
      );
    });

    it('debe lanzar BadRequestException para errores 23503 no contemplados', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (otraLlave)=(...) no existe',
      };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Key (otraLlave)=(...) no existe',
      );
    });

    it('debe lanzar InternalServerErrorException si es un error desconocido', async () => {
      const unknownError = new Error('Se cayó el servidor SQL');
      mockEntityManager.save.mockRejectedValue(unknownError);

      await expect(service.create(createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.internalServerError',
      );
    });
  });
});
