import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ItAssetsInvoicesService } from './it-assets-invoices.service';
import { ItAssetsInvoice } from '../entities/it-assets-invoice.entity';
import { CreateItAssetsInvoiceDto } from '../dto/create-it-assets-invoice.dto';
import { UpdateItAssetsInvoiceDto } from '../dto/update-it-assets-invoice.dto';

describe('ItAssetsInvoicesService', () => {
  let service: ItAssetsInvoicesService;
  let repository: jest.Mocked<Repository<ItAssetsInvoice>>;

  const mockInvoice: ItAssetsInvoice = {
    id: 'invoice-uuid-1',
    idInternal: 'FAC-2026-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    itAssets: [],
  };

  const createMockQueryBuilder = () => {
    const qb: Partial<SelectQueryBuilder<ItAssetsInvoice>> = {
      select: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockInvoice], 1]),
    };
    return qb as SelectQueryBuilder<ItAssetsInvoice>;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItAssetsInvoicesService,
        {
          provide: getRepositoryToken(ItAssetsInvoice),
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
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<ItAssetsInvoicesService>(ItAssetsInvoicesService);
    repository = module.get(getRepositoryToken(ItAssetsInvoice));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe registrar y retornar una factura', async () => {
      const dto: CreateItAssetsInvoiceDto = { idInternal: 'FAC-2026-001' };
      repository.create.mockReturnValue(mockInvoice);
      repository.save.mockResolvedValue(mockInvoice);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockInvoice);
      expect(result).toEqual(mockInvoice);
    });

    it('debe lanzar ConflictException si idInternal ya existe (23505)', async () => {
      repository.create.mockReturnValue(mockInvoice);
      repository.save.mockRejectedValue({
        code: '23505',
        detail: 'Key (idInternal)=(FAC-2026-001) already exists.',
      });

      await expect(
        service.create({ idInternal: 'FAC-2026-001' }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar BadRequestException si el error 23505 no es de idInternal', async () => {
      repository.create.mockReturnValue(mockInvoice);
      repository.save.mockRejectedValue({
        code: '23505',
        detail: 'Unique constraint violation',
      });

      await expect(
        service.create({ idInternal: 'FAC-2026-001' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si hay error de llave foránea (23503)', async () => {
      repository.create.mockReturnValue(mockInvoice);
      repository.save.mockRejectedValue({
        code: '23503',
        detail: 'Foreign key violation',
      });

      await expect(
        service.create({ idInternal: 'FAC-2026-001' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar InternalServerErrorException en otros errores', async () => {
      repository.create.mockReturnValue(mockInvoice);
      repository.save.mockRejectedValue(new Error('Unknown DB Error'));

      await expect(
        service.create({ idInternal: 'FAC-2026-001' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('debe listar facturas con paginación por defecto', async () => {
      const qb = createMockQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({});

      expect(repository.createQueryBuilder).toHaveBeenCalledWith(
        'itAssetsInvoice',
      );
      expect(result).toEqual({
        itAssetsInvoices: [mockInvoice],
        meta: {
          total: 1,
          page: 1,
          lastPage: 1,
        },
      });
    });

    it('debe filtrar por idInternal cuando se provee query', async () => {
      const qb = createMockQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ query: 'fac' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'LOWER(itAssetsInvoice.idInternal) LIKE :query',
        { query: '%fac%' },
      );
      expect(result.itAssetsInvoices).toEqual([mockInvoice]);
    });
  });

  describe('update', () => {
    it('debe actualizar la factura', async () => {
      const dto: UpdateItAssetsInvoiceDto = { idInternal: 'FAC-NEW' };
      const updateResult = { generatedMaps: [], raw: [], affected: 1 };
      repository.update.mockResolvedValue(updateResult);

      const result = await service.update('invoice-uuid-1', dto);

      expect(repository.update).toHaveBeenCalledWith('invoice-uuid-1', dto);
      expect(result).toEqual(updateResult);
    });
  });
});
