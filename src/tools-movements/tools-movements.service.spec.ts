import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from '@nestjs/common';

import { ToolsMovementsService } from './tools-movements.service';
import { ToolsMovement, MovementType } from './entities/tools-movement.entity';
import { FilterToolsMovementsDto } from './dto/filter-tools-movements.dto';

describe('ToolsMovementsService', () => {
  let service: ToolsMovementsService;
  let repository: jest.Mocked<Repository<ToolsMovement>>;

  // Mock del QueryBuilder
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  // Mock de respuesta general
  const mockMovement = {
    id: 'movement-uuid',
    type: MovementType.IN, // o 'IN' según tu entidad
    tool: { id: 'tool-uuid' },
  } as unknown as ToolsMovement;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsMovementsService,
        {
          provide: getRepositoryToken(ToolsMovement),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key), // Retorna la llave tal cual
          },
        },
      ],
    }).compile();

    service = module.get<ToolsMovementsService>(ToolsMovementsService);
    repository = module.get(getRepositoryToken(ToolsMovement));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ========================================================================
     FIND ALL (QueryBuilder Dinámico)
  ======================================================================== */
  describe('findAll', () => {
    it('debe construir la consulta base con los joins, paginación por defecto y orden', async () => {
      const filterDto: FilterToolsMovementsDto = {};
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockMovement], 1]);

      const result = await service.findAll(filterDto);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith(
        'toolsMovement',
      );

      // Joins base
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'toolsMovement.tool',
        'tool',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'toolsMovement.movementIn',
        'movementIn',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'toolsMovement.movementOut',
        'movementOut',
      );

      // Paginación por defecto (limit 10, offset 0)
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);

      // Orden por defecto
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'toolsMovement.createdAt',
        'DESC',
      );

      // Meta Data
      expect(result).toEqual({
        toolsMovements: [mockMovement],
        meta: {
          total: 1,
          page: 1,
          lastPage: 1,
        },
      });
    });

    it('debe aplicar la búsqueda global usando Brackets cuando se provee el filtro "query"', async () => {
      const filterDto: FilterToolsMovementsDto = { query: 'Taladro' };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      // Verificamos que se llamó un andWhere enviando una instancia de Brackets
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(Brackets),
      );
    });

    it('debe aplicar filtro por "type" si está presente', async () => {
      const filterDto: FilterToolsMovementsDto = { type: MovementType.IN };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'toolsMovement.type = :type',
        { type: MovementType.IN },
      );
    });

    it('debe aplicar filtro por "startDate" si está presente', async () => {
      const filterDto: FilterToolsMovementsDto = { startDate: '2026-01-01' };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'CAST(toolsMovement.createdAt AS DATE) >= :startDate',
        { startDate: '2026-01-01' },
      );
    });

    it('debe aplicar filtro por "endDate" si está presente', async () => {
      const filterDto: FilterToolsMovementsDto = { endDate: '2026-12-31' };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'CAST(toolsMovement.createdAt AS DATE) <= :endDate',
        { endDate: '2026-12-31' },
      );
    });

    it('debe calcular la paginación correctamente (página 3, limit 5)', async () => {
      const filterDto: FilterToolsMovementsDto = { limit: 5, offset: 10 }; // offset 10 con limit 5 = Página 3
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 22]); // Total 22 items

      const result = await service.findAll(filterDto);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);

      expect(result.meta).toEqual({
        total: 22,
        page: 3, // Math.floor(10/5) + 1 = 3
        lastPage: 5, // Math.ceil(22/5) = 5
      });
    });
  });

  /* ========================================================================
     FIND ONE
  ======================================================================== */
  describe('findOne', () => {
    it('debe devolver el movimiento de la base de datos con todas sus relaciones anidadas', async () => {
      repository.findOne.mockResolvedValue(mockMovement);

      const result = await service.findOne('movement-uuid');
      const expectedRelations = expect.any(Object) as object;

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'movement-uuid' },
        relations: expectedRelations, // Validamos que traiga las relaciones complejas
      });
      expect(result).toEqual(mockMovement);
    });

    it('debe lanzar NotFoundException si el movimiento no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'errors.tools.movements.notFoundWithId',
      );
    });
  });
});
