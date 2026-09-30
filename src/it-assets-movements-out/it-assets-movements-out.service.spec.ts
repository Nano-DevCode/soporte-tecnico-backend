import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import { ItAssetsMovementsOutService } from './it-assets-movements-out.service';
import { CreateItAssetsMovementsOutDto } from './dto/create-it-assets-movements-out.dto';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';
import {
  ItAssetsMovement,
  MovementType,
} from 'src/it-assets-movements/entities/it-assets-movement.entity';

describe('ItAssetsMovementsOutService', () => {
  let service: ItAssetsMovementsOutService;

  type MockEntityManager = {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  // Mock del EntityManager para las transacciones
  const mockEntityManager: MockEntityManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  // Mock de un activo (ItAsset) en buen estado y no en uso
  const mockAsset = {
    id: 'asset-uuid',
    inUse: false,
    itAssetStatus: { id: 'status-old' },
  } as ItAsset;

  // Mock del DTO de creación
  const createDto: CreateItAssetsMovementsOutDto = {
    itAssetId: 'asset-uuid',
    itAssetsStatusId: 'status-new',
    observations: 'Salida a campo',
    description: 'Se lleva el equipo para revisión',
    voucher: 'VALE-123',
    staffId: 'staff-uuid',
    ticketId: 'ticket-uuid',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItAssetsMovementsOutService,
        {
          provide: DataSource,
          useValue: {
            // Simulamos la transacción inyectando nuestro mockEntityManager
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
            t: jest.fn((key: string) => key), // Retorna la llave directamente para facilitar las aserciones
          },
        },
      ],
    }).compile();

    service = module.get<ItAssetsMovementsOutService>(
      ItAssetsMovementsOutService,
    );

    // Silenciamos los logs de error nativos para mantener la terminal limpia
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ========================================================================
     PRUEBAS DE CREACIÓN Y LÓGICA DE NEGOCIO
  ======================================================================== */
  describe('create', () => {
    it('debe registrar la salida correctamente, actualizando el activo y creando el movimiento', async () => {
      // Configuramos los mocks
      mockEntityManager.findOne.mockResolvedValue({ ...mockAsset });
      mockEntityManager.save.mockResolvedValueOnce({}); // Save del activo
      const newMovement = { id: 'movement-uuid', type: MovementType.OUT };
      mockEntityManager.create.mockReturnValue(newMovement);
      mockEntityManager.save.mockResolvedValueOnce(newMovement); // Save del movimiento

      const result = await service.create(createDto);

      // 1. Verificamos que buscó el activo
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(ItAsset, {
        where: { id: createDto.itAssetId },
      });

      // 2. Verificamos que actualizó el estado y lo marcó en uso
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(
        1,
        ItAsset,
        expect.objectContaining({
          inUse: true,
          itAssetStatus: { id: 'status-new' },
        }),
      );

      const expectedMovementOut: {
        itAssetsStatus: { id: string };
        observations: string;
        staff: { id: string };
        ticket: { id: string };
      } = {
        itAssetsStatus: { id: 'status-new' },
        observations: 'Salida a campo',
        staff: { id: 'staff-uuid' },
        ticket: { id: 'ticket-uuid' },
      };

      // 3. Verificamos que creó el movimiento con las relaciones correctas
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        ItAssetsMovement,
        expect.objectContaining({
          type: MovementType.OUT,
          movementOut: expect.objectContaining(expectedMovementOut) as Record<
            string,
            unknown
          >,
        }),
      );

      // 4. Verificamos el resultado devuelto
      expect(result).toEqual(newMovement);
    });

    it('debe registrar la salida aunque no se envíen staffId y ticketId (parámetros opcionales)', async () => {
      const createDtoWithoutOptionals: CreateItAssetsMovementsOutDto = {
        ...createDto,
        staffId: undefined,
        ticketId: undefined,
      };

      mockEntityManager.findOne.mockResolvedValue({ ...mockAsset });
      mockEntityManager.save.mockResolvedValue({});
      mockEntityManager.create.mockReturnValue({});

      await service.create(createDtoWithoutOptionals);

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        ItAssetsMovement,
        expect.objectContaining({
          movementOut: expect.any(Object) as unknown,
        }),
      );

      const createCall = mockEntityManager.create.mock.calls[0] as [
        unknown,
        {
          movementOut: {
            staff?: string;
            ticket?: string;
          };
        },
      ];
      const createdMovementPayload = createCall[1];
      expect(createdMovementPayload.movementOut.staff).toBeUndefined();
      expect(createdMovementPayload.movementOut.ticket).toBeUndefined();
    });

    it('debe lanzar BadRequestException si el activo no existe', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'itAssets.movementsOut.assetNotFound',
      );
    });

    it('debe lanzar ConflictException si el activo ya está en uso', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        ...mockAsset,
        inUse: true,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'itAssets.movementsOut.alreadyInUse',
      );
    });
  });

  /* ========================================================================
     PRUEBAS DEL MANEJADOR DE ERRORES DE BASE DE DATOS
  ======================================================================== */
  describe('handleDBExeptions (lanzados indirectamente a través del catch)', () => {
    beforeEach(() => {
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
      const dbError = { code: '23505', detail: 'Llave duplicada detalle' };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Llave duplicada detalle',
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

    it('debe lanzar ConflictException si falla la foránea del Personal/Staff (23503)', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (staffId)=(...) no existe',
      };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.itAssets.movementsOut.staffNotFound',
      );
    });

    it('debe lanzar ConflictException si falla la foránea del Ticket (23503)', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (ticketId)=(...) no existe',
      };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.itAssets.movementsOut.ticketNotFound',
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
      const unknownError = new Error('Se cayó la base de datos');
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
