import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from '@nestjs/common';
import { ItAssetsMovementsService } from './it-assets-movements.service';
import {
  ItAssetsMovement,
  MovementType,
} from '../entities/it-assets-movement.entity';
import { FilterItAssetsMovementsDto } from '../dto/filter-it-assets-movements.dto';

describe('ItAssetsMovementsService', () => {
  let service: ItAssetsMovementsService;
  let repository: jest.Mocked<Repository<ItAssetsMovement>>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockMovement = {
    id: 'movement-uuid',
    type: MovementType.IN,
    itAsset: { id: 'asset-uuid' },
  } as unknown as ItAssetsMovement;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItAssetsMovementsService,
        {
          provide: getRepositoryToken(ItAssetsMovement),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
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

    service = module.get<ItAssetsMovementsService>(ItAssetsMovementsService);
    repository = module.get(getRepositoryToken(ItAssetsMovement));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe construir la consulta y retornar movimientos paginados con filtros por defecto', async () => {
      const filterDto: FilterItAssetsMovementsDto = {};
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockMovement], 1]);

      const result = await service.findAll(filterDto);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith(
        'itAssetsMovement',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'itAssetsMovement.itAsset',
        'itAsset',
      );
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual({
        itAssetsMovements: [mockMovement],
        meta: {
          total: 1,
          page: 1,
          lastPage: 1,
        },
      });
    });

    it('debe aplicar filtros cuando se proporcionan query, type, startDate y endDate', async () => {
      const filterDto: FilterItAssetsMovementsDto = {
        limit: 5,
        offset: 5,
        query: 'Dell',
        type: MovementType.OUT,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(Brackets),
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'itAssetsMovement.type = :type',
        { type: MovementType.OUT },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'CAST(itAssetsMovement.createdAt AS DATE) >= :startDate',
        { startDate: '2026-01-01' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'CAST(itAssetsMovement.createdAt AS DATE) <= :endDate',
        { endDate: '2026-01-31' },
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar un movimiento si existe con todas sus relaciones', async () => {
      const id = 'movement-uuid';
      repository.findOne.mockResolvedValue(mockMovement);

      const result = await service.findOne(id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: {
          movementIn: true,
          movementOut: {
            staff: true,
            ticket: true,
            itAssetsStatus: true,
          },
          itAsset: {
            itAssetsType: true,
            itAssetStatus: true,
          },
        },
      });
      expect(result).toEqual(mockMovement);
    });

    it('debe lanzar NotFoundException si el movimiento no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
