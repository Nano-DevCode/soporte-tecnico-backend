import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';

import { BatchesproductsService } from './batchesproducts.service';
import { Batchesproduct } from './entities/batchesproduct.entity';
import { Consumable } from 'src/consumables/entities/consumable.entity';
import { ConsumableMovement } from 'src/consumables/movements/entities/consumable-movement.entity';
import { MovementAplication } from 'src/consumables/movements/applications/entities/movement_aplication.entity';
import { MovementType } from 'src/consumables/movements/types/entities/movement_type.entity';
import { Department } from 'src/departments/entities/department.entity';
import { CreateBatchesproductDto } from './dto/create-batchesproduct.dto';

describe('BatchesproductsService - create', () => {
  let service: BatchesproductsService;
  let batchRepository: jest.Mocked<Repository<Batchesproduct>>;
  let dataSource: jest.Mocked<DataSource>;
  let i18n: jest.Mocked<I18nService>;
  let queryRunnerMock: jest.Mocked<QueryRunner>;

  // Objects Mock reutilizables
  const mockCreateDto: CreateBatchesproductDto = {
    num_requirement: '  REQ-2024-001  ',
    items: [
      {
        id_consumable: 'consumable-uuid-1',
        arrival_amount: 10,
        cost_batch: 500,
      },
    ],
  };

  const mockAppEntrance: MovementAplication = {
    id: 1,
    acronym: 'ENT',
    name: 'Entrada de Almacén',
    consumableMovements: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockDefaultDepartment = {
    id: 'dept-uuid-cc',
    name: 'Departamento de Centro de Cómputo',
  } as Department;

  const mockConsumable = {
    id: 'consumable-uuid-1',
    item_code: 'CONS-001',
    description: 'Tóner HP',
    number_uses: 2,
    id_unit_measurement: { id: 'unit-1', name: 'Pieza' },
  } as unknown as Consumable;

  beforeEach(async () => {
    // 1. Mock de QueryRunner para la transacción
    queryRunnerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        create: jest.fn((_entity: unknown, dto: Record<string, unknown>) => ({
          ...dto,
          id: '5a2e81b4-96c2-4d11-8231-1823746de507',
        })),
        save: jest.fn((_entity: unknown, dto: Record<string, unknown>) =>
          Promise.resolve(dto || {}),
        ),
      },
    } as unknown as jest.Mocked<QueryRunner>;

    // 2. Mock del QueryBuilder para la obtención del correlativo
    const mockMovementQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ maxId: 15 }),
    };

    // 3. Fabrica de Repositorios para DataSource
    const mockGetRepository = jest.fn((entity) => {
      if (entity === MovementAplication) {
        return { findOneBy: jest.fn().mockResolvedValue(mockAppEntrance) };
      }
      if (entity === MovementType) {
        return {
          findOneBy: jest.fn().mockResolvedValue({ id: 1, name: 'Entrada' }),
        };
      }
      if (entity === Department) {
        return {
          findOneBy: jest.fn().mockResolvedValue(mockDefaultDepartment),
        };
      }
      if (entity === ConsumableMovement) {
        return {
          createQueryBuilder: jest
            .fn()
            .mockReturnValue(mockMovementQueryBuilder),
        };
      }
      return {};
    });

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
      getRepository: mockGetRepository,
    };

    // 4. Repositorios de NestJS
    const mockBatchRepository = {
      findOne: jest.fn(),
    };

    const mockI18n = {
      t: jest.fn(
        (key: string, options?: { args?: Record<string, unknown> }) => {
          if (options?.args) {
            return `${key} ${JSON.stringify(options.args)}`;
          }
          return key;
        },
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesproductsService,
        {
          provide: getRepositoryToken(Batchesproduct),
          useValue: mockBatchRepository,
        },
        {
          provide: getRepositoryToken(Consumable),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<BatchesproductsService>(BatchesproductsService);
    batchRepository = module.get(getRepositoryToken(Batchesproduct));
    dataSource = module.get(DataSource);
    i18n = module.get(I18nService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('create - Exitoso', () => {
    it('debe registrar el lote y el movimiento en la bitácora dentro de la transacción', async () => {
      batchRepository.findOne.mockResolvedValueOnce(null);
      (queryRunnerMock.manager.findOne as jest.Mock).mockResolvedValueOnce(
        mockConsumable,
      );

      const result = await service.create(mockCreateDto);

      // Verificaciones
      expect(batchRepository.findOne).toHaveBeenCalledWith({
        where: { num_requirement: 'REQ-2024-001' },
      });

      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();

      expect(queryRunnerMock.manager.create).toHaveBeenCalledWith(
        Batchesproduct,
        expect.objectContaining({
          id_consumable: mockConsumable,
          num_requirement: 'REQ-2024-001',
          arrival_amount: 10,
          quantity_consumable: 20,
          available_stock: 20,
          cost_batch: 500,
          cost_unit: 25,
        }),
      );

      expect(queryRunnerMock.manager.create).toHaveBeenCalledWith(
        ConsumableMovement,
        expect.objectContaining({
          id_movement_type: { id: 1 },
          id_movement_aplication: mockAppEntrance,
          id_departament_consumable: mockDefaultDepartment,
          code_movement_aplication: 'ENT_16',
          quantity_consumable: 10,
          observations: 'Entrada de consumibles, requisición: REQ-2024-001',
          movement_cost: 500,
        }),
      );

      expect(queryRunnerMock.manager.save).toHaveBeenCalledTimes(2);
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();

      expect(result).toEqual({
        message: 'Lotes registrados con éxito mediante bolsa de herramientas',
        code_movement_aplication: 'ENT_16',
        total_processed: 1,
        batches: expect.any(Array) as unknown,
      });
    });

    it('debe usar number_uses = 1 si el consumible no tiene asignado número de usos', async () => {
      const consumableWithoutUses = { ...mockConsumable, number_uses: 0 };
      batchRepository.findOne.mockResolvedValueOnce(null);
      (queryRunnerMock.manager.findOne as jest.Mock).mockResolvedValueOnce(
        consumableWithoutUses,
      );

      await service.create(mockCreateDto);

      expect(queryRunnerMock.manager.create).toHaveBeenCalledWith(
        Batchesproduct,
        expect.objectContaining({
          quantity_consumable: 10,
          available_stock: 10,
          cost_unit: 50,
        }),
      );
    });
  });

  describe('create - Validaciones previas a la transacción', () => {
    it('debe lanzar ConflictException si el requerimiento ya existe', async () => {
      batchRepository.findOne.mockResolvedValueOnce({
        id: 'existing-uuid',
      } as Batchesproduct);

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );

      expect(i18n.t).toHaveBeenCalledWith(
        'errors.batchesproducts.requirementAlreadyExists',
      );
      expect(queryRunnerMock.connect).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si MovementAplication (id: 1) no existe', async () => {
      batchRepository.findOne.mockResolvedValueOnce(null);

      jest.spyOn(dataSource, 'getRepository').mockImplementationOnce(
        () =>
          ({
            findOneBy: jest.fn().mockResolvedValue(null),
          }) as unknown as ReturnType<DataSource['getRepository']>,
      );

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(i18n.t).toHaveBeenCalledWith(
        'errors.movementAplications.notFound',
        {
          args: { id: 1 },
        },
      );
      expect(queryRunnerMock.connect).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el departamento por defecto no existe', async () => {
      batchRepository.findOne.mockResolvedValueOnce(null);

      jest.spyOn(dataSource, 'getRepository').mockImplementation((entity) => {
        if (entity === MovementAplication) {
          return {
            findOneBy: jest.fn().mockResolvedValue(mockAppEntrance),
          } as unknown as ReturnType<DataSource['getRepository']>;
        }
        if (entity === MovementType) {
          return {
            findOneBy: jest.fn().mockResolvedValue({ id: 1, name: 'Entrada' }),
          } as unknown as ReturnType<DataSource['getRepository']>;
        }
        if (entity === Department) {
          return {
            findOneBy: jest.fn().mockResolvedValue(null),
          } as unknown as ReturnType<DataSource['getRepository']>;
        }
        return {} as unknown as ReturnType<DataSource['getRepository']>;
      });

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(i18n.t).toHaveBeenCalledWith(
        'errors.department.departmentNotFound',
        {
          args: { name: 'Departamento de Centro de Cómputo' },
        },
      );
      expect(queryRunnerMock.connect).not.toHaveBeenCalled();
    });
  });

  describe('create - Manejo de Errores dentro de la transacción', () => {
    it('debe hacer rollback y lanzar NotFoundException si un consumible de la lista no existe', async () => {
      batchRepository.findOne.mockResolvedValueOnce(null);
      (queryRunnerMock.manager.findOne as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(i18n.t).toHaveBeenCalledWith(
        'errors.consumables.consumableNotFound',
        {
          args: { id: 'consumable-uuid-1' },
        },
      );
    });

    it('debe hacer rollback y transformar error de Postgres 23505 a ConflictException', async () => {
      batchRepository.findOne.mockResolvedValueOnce(null);
      (queryRunnerMock.manager.findOne as jest.Mock).mockResolvedValueOnce(
        mockConsumable,
      );
      (queryRunnerMock.manager.save as jest.Mock).mockRejectedValueOnce({
        code: '23505',
      });

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        ConflictException,
      );

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(i18n.t).toHaveBeenCalledWith(
        'errors.batchesproducts.requirementAlreadyExists',
      );
    });

    it('debe hacer rollback y transformar error de Postgres 23503 a BadRequestException', async () => {
      batchRepository.findOne.mockResolvedValueOnce(null);
      (queryRunnerMock.manager.findOne as jest.Mock).mockResolvedValueOnce(
        mockConsumable,
      );
      (queryRunnerMock.manager.save as jest.Mock).mockRejectedValueOnce({
        code: '23503',
      });

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(i18n.t).toHaveBeenCalledWith(
        'errors.batchesproducts.foreignKeyViolation',
      );
    });

    it('debe hacer rollback y lanzar InternalServerErrorException en caso de error no controlado', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      batchRepository.findOne.mockResolvedValueOnce(null);
      (queryRunnerMock.manager.findOne as jest.Mock).mockResolvedValueOnce(
        mockConsumable,
      );
      (queryRunnerMock.manager.save as jest.Mock).mockRejectedValueOnce(
        new Error('Database Connection Lost'),
      );

      await expect(service.create(mockCreateDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(i18n.t).toHaveBeenCalledWith('errors.internalServerError');
    });
  });
});
