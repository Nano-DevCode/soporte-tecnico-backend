import { Test, TestingModule } from '@nestjs/testing';
import { ConsumablesCrudService } from './consumables-crud.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Consumable } from '../entities/consumable.entity';
import { Batchesproduct } from '../batches/entities/batchesproduct.entity';
import { Typeconsumable } from '../types/entities/typeconsumable.entity';
import { UnitMeasurement } from '../units/entities/unit-measurement.entity';
import { BrandConsumable } from '../brands/entities/brand-consumable.entity';
import { ConsumableUbication } from '../ubications/entities/consumable_ubication.entity';
import { I18nService } from 'nestjs-i18n';
import { FilesService, MulterFile } from 'src/files/files.service';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateConsumableDto } from '../dto/create-consumable.dto';

describe('ConsumablesCrudService', () => {
  let service: ConsumablesCrudService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn(),
    getCount: jest.fn(),
    getOne: jest.fn(),
  };

  const mockConsumableRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockBatchRepo = {
    findOne: jest.fn(),
  };

  const mockTypeRepo = {
    findOneBy: jest.fn(),
  };

  const mockUnitRepo = {
    findOneBy: jest.fn(),
  };

  const mockBrandRepo = {
    findOneBy: jest.fn(),
  };

  const mockUbicationRepo = {
    findOneBy: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn((key: string) => key),
  };

  const mockFilesService = {
    uploadFile: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb: (manager: unknown) => unknown) =>
      cb({
        create: jest.fn((entity, data) => ({ id: 'c-1', ...data })),
        save: jest.fn((entity) => Promise.resolve(entity)),
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumablesCrudService,
        {
          provide: getRepositoryToken(Consumable),
          useValue: mockConsumableRepo,
        },
        {
          provide: getRepositoryToken(Batchesproduct),
          useValue: mockBatchRepo,
        },
        {
          provide: getRepositoryToken(Typeconsumable),
          useValue: mockTypeRepo,
        },
        {
          provide: getRepositoryToken(UnitMeasurement),
          useValue: mockUnitRepo,
        },
        {
          provide: getRepositoryToken(BrandConsumable),
          useValue: mockBrandRepo,
        },
        {
          provide: getRepositoryToken(ConsumableUbication),
          useValue: mockUbicationRepo,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ConsumablesCrudService>(ConsumablesCrudService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validDto: CreateConsumableDto = {
      name: 'Toner HP 85A',
      description: 'Cartucho toner',
      stockMin: 5,
      stockMax: 20,
      id_brand_consumable: 'brand-1',
      id_type_consumable: 1,
      id_ubication_consumable: 'ubi-1',
      id_unit_measurement: 1,
      number_uses: 1600,
    };

    it('debe lanzar NotFoundException si la marca no existe', async () => {
      mockBrandRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si el tipo no existe', async () => {
      mockBrandRepo.findOneBy.mockResolvedValue({ id: 'brand-1' });
      mockTypeRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si la ubicacion no existe', async () => {
      mockBrandRepo.findOneBy.mockResolvedValue({ id: 'brand-1' });
      mockTypeRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockUbicationRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si la unidad de medida no existe', async () => {
      mockBrandRepo.findOneBy.mockResolvedValue({ id: 'brand-1' });
      mockTypeRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockUbicationRepo.findOneBy.mockResolvedValue({ id: 'ubi-1' });
      mockUnitRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si la descripcion ya existe', async () => {
      mockBrandRepo.findOneBy.mockResolvedValue({ id: 'brand-1' });
      mockTypeRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockUbicationRepo.findOneBy.mockResolvedValue({ id: 'ubi-1' });
      mockUnitRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockConsumableRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.create(validDto)).rejects.toThrow(ConflictException);
    });

    it('debe lanzar BadRequestException si unidad es 1 y falta number_uses', async () => {
      mockBrandRepo.findOneBy.mockResolvedValue({ id: 'brand-1' });
      mockTypeRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockUbicationRepo.findOneBy.mockResolvedValue({ id: 'ubi-1' });
      mockUnitRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockConsumableRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ ...validDto, number_uses: undefined }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear exitosamente un consumible sin imagen', async () => {
      mockBrandRepo.findOneBy.mockResolvedValue({ id: 'brand-1' });
      mockTypeRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockUbicationRepo.findOneBy.mockResolvedValue({ id: 'ubi-1' });
      mockUnitRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockConsumableRepo.findOne.mockResolvedValue(null);
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxId: 5 });

      const result = await service.create(validDto);

      expect(result).toBeDefined();
      expect(result.item_code).toBe('ART_6');
      expect(result.name).toBe('Toner HP 85A');
    });

    it('debe crear exitosamente un consumible con imagen adjunta', async () => {
      mockBrandRepo.findOneBy.mockResolvedValue({ id: 'brand-1' });
      mockTypeRepo.findOneBy.mockResolvedValue({ id: 1 });
      mockUbicationRepo.findOneBy.mockResolvedValue({ id: 'ubi-1' });
      mockUnitRepo.findOneBy.mockResolvedValue({ id: 2 });
      mockConsumableRepo.findOne.mockResolvedValue(null);
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      mockFilesService.uploadFile.mockResolvedValue({
        url: 'https://minio/image.webp',
      });

      const file = { buffer: Buffer.from('') } as MulterFile;
      const result = await service.create(
        { ...validDto, id_unit_measurement: 2 },
        file,
      );

      expect(result).toBeDefined();
      expect(mockFilesService.uploadFile).toHaveBeenCalled();
      expect(result.imageUrl).toBe('https://minio/image.webp');
    });
  });

  describe('findAll', () => {
    it('debe retornar lista paginada y stock calculado', async () => {
      const mockEntity = { id: 'c-1', name: 'Item 1' } as Consumable;
      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [mockEntity],
        raw: [{ c_available_stock: '15' }],
      });
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await service.findAll({
        limit: 10,
        offset: 0,
        query: 'toner',
        id_brand_consumable: 'brand-1',
      });

      expect(result.consumables).toHaveLength(1);
      expect(result.consumables[0].available_stock).toBe(15);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('debe retornar consumible con available_stock si existe', async () => {
      const mockEntity = { id: 'c-1', name: 'Item 1' } as Consumable;
      mockQueryBuilder.getRawOne.mockResolvedValue({ c_available_stock: '25' });
      mockQueryBuilder.getOne.mockResolvedValue(mockEntity);

      const result = await service.findOne('c-1');

      expect(result.id).toBe('c-1');
      expect(result.available_stock).toBe(25);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(null);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('debe eliminar el consumible si existe', async () => {
      const mockEntity = { id: 'c-1' } as Consumable;
      mockQueryBuilder.getRawOne.mockResolvedValue({ c_available_stock: '0' });
      mockQueryBuilder.getOne.mockResolvedValue(mockEntity);
      mockConsumableRepo.remove.mockResolvedValue(mockEntity);

      const result = await service.remove('c-1');

      expect(mockConsumableRepo.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'c-1' }),
      );
      expect(result).toEqual({ id: 'c-1', deleted: true });
    });
  });
});
