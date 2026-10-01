import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ItAssetsTypesService } from './it-assets-types.service';
import { ItAssetsType } from '../entities/it-assets-type.entity';
import { CreateItAssetsTypeDto } from '../dto/create-it-assets-type.dto';
import { UpdateItAssetsTypeDto } from '../dto/update-it-assets-type.dto';

describe('ItAssetsTypesService', () => {
  let service: ItAssetsTypesService;
  let repository: jest.Mocked<Repository<ItAssetsType>>;

  const mockType: ItAssetsType = {
    id: 'type-uuid-1',
    name: 'MONITOR',
    createdAt: new Date(),
    updatedAt: new Date(),
    itAssets: [],
  };

  const createMockQueryBuilder = () => {
    const qb: Partial<SelectQueryBuilder<ItAssetsType>> = {
      select: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockType], 1]),
    };
    return qb as SelectQueryBuilder<ItAssetsType>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItAssetsTypesService,
        {
          provide: getRepositoryToken(ItAssetsType),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string, options?: { args?: { name?: string } }) => {
              if (options?.args?.name) return `${key}: ${options.args.name}`;
              return key;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ItAssetsTypesService>(ItAssetsTypesService);
    repository = module.get(getRepositoryToken(ItAssetsType));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y guardar un tipo de activo exitosamente', async () => {
      const dto: CreateItAssetsTypeDto = { name: 'MONITOR' };
      repository.create.mockReturnValue(mockType);
      repository.save.mockResolvedValue(mockType);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockType);
      expect(result).toEqual(mockType);
    });

    it('debe lanzar BadRequestException si el nombre ya existe (23505)', async () => {
      repository.create.mockReturnValue(mockType);
      repository.save.mockRejectedValue({
        code: '23505',
        detail: 'Key (name)=(MONITOR) already exists.',
      });

      await expect(service.create({ name: 'MONITOR' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si existe violación de llave foránea (23503)', async () => {
      repository.create.mockReturnValue(mockType);
      repository.save.mockRejectedValue({
        code: '23503',
        detail: 'Foreign key violation',
      });

      await expect(service.create({ name: 'MONITOR' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar InternalServerErrorException en otros errores', async () => {
      repository.create.mockReturnValue(mockType);
      repository.save.mockRejectedValue(new Error('Unknown DB Error'));

      await expect(service.create({ name: 'MONITOR' })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('debe listar tipos de activos con paginación por defecto', async () => {
      const qb = createMockQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({});

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('itAssetsType');
      expect(result).toEqual({
        itAssetsTypes: [mockType],
        meta: {
          total: 1,
          page: 1,
          lastPage: 1,
        },
      });
    });

    it('debe aplicar filtro de búsqueda si query está presente', async () => {
      const qb = createMockQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ query: 'mon' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'LOWER(itAssetsType.name) LIKE :query',
        { query: '%mon%' },
      );
      expect(result.itAssetsTypes).toEqual([mockType]);
    });
  });

  describe('update', () => {
    it('debe actualizar el tipo de activo', async () => {
      const dto: UpdateItAssetsTypeDto = { name: 'LAPTOP' };
      const updateResult = { generatedMaps: [], raw: [], affected: 1 };
      repository.update.mockResolvedValue(updateResult);

      const result = await service.update('type-uuid-1', dto);

      expect(repository.update).toHaveBeenCalledWith('type-uuid-1', dto);
      expect(result).toEqual(updateResult);
    });
  });
});
