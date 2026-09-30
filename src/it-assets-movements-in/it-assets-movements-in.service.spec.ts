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
import { CreateItAssetsMovementsInDto } from './dto/create-it-assets-movements-in.dto';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';
import {
  ItAssetsMovement,
  MovementType,
} from 'src/it-assets-movements/entities/it-assets-movement.entity';

describe('ItAssetsMovementsInService', () => {
  let service: ItAssetsMovementsInService;

  type MockEntityManager = {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  // Mock del EntityManager para simular las transacciones
  const mockEntityManager: MockEntityManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  // Mock de un activo que actualmente está fuera/en uso (inUse: true)
  const mockAsset = {
    id: 'asset-uuid',
    inUse: true,
    itAssetStatus: { id: 'status-old' },
  } as ItAsset;

  // Mock del DTO de entrada
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

    // Silenciamos los logs de error nativos para mantener la terminal limpia
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ========================================================================
     PRUEBAS DE CREACIÓN (ENTRADAS)
  ======================================================================== */
  describe('create', () => {
    it('debe registrar la entrada correctamente, actualizando el activo a inUse=false y creando el movimiento', async () => {
      // Retornamos un clon para evitar contaminación de referencias
      mockEntityManager.findOne.mockResolvedValue({ ...mockAsset });
      mockEntityManager.save.mockResolvedValueOnce({}); // Save del activo
      const newMovement = { id: 'movement-uuid', type: MovementType.IN };
      mockEntityManager.create.mockReturnValue(newMovement);
      mockEntityManager.save.mockResolvedValueOnce(newMovement); // Save del movimiento

      const result = await service.create(createDto);

      // 1. Verifica que buscó el activo
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(ItAsset, {
        where: { id: createDto.itAssetId },
      });

      // 2. Verifica que el activo cambió a inUse=false y actualizó el estado
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(
        1,
        ItAsset,
        expect.objectContaining({
          inUse: false,
          itAssetStatus: { id: 'status-new' },
        }),
      );

      // 3. Verifica que se creó el movimiento de tipo IN
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

      // 4. Verifica el resultado final
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
      // Activo que ya está guardado en el almacén
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

  /* ========================================================================
     PRUEBAS DE FIND ONE (MÉTODO ESPECÍFICO DE ESTE SERVICIO)
  ======================================================================== */
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

  /* ========================================================================
     PRUEBAS DEL MANEJADOR DE ERRORES DE BASE DE DATOS
  ======================================================================== */
  describe('handleDBExeptions (lanzados indirectamente a través del catch)', () => {
    beforeEach(() => {
      // Retornamos un objeto limpio en cada iteración para evitar contaminación
      mockEntityManager.findOne.mockImplementation(() => ({
        ...mockAsset,
      }));
    });

    it('debe relanzar errores HttpException nativos (ej. si falla una validación previa)', async () => {
      const httpError = new BadRequestException('Error pre-existente');
      mockEntityManager.save.mockRejectedValue(httpError);

      await expect(service.create(createDto)).rejects.toThrow(httpError);
    });

    it('debe lanzar ConflictException en error 23505 (Llave duplicada genérica)', async () => {
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
        'errors.itAssets.statusNotFound',
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
