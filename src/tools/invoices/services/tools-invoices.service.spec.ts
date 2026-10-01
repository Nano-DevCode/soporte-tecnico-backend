import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpdateResult } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ToolsInvoicesService } from './tools-invoices.service';
import { ToolsInvoice } from '../entities/tools-invoice.entity';
import { CreateToolsInvoiceDto } from '../dto/create-tools-invoice.dto';
import { FilterToolsInvoiceDto } from '../dto/filter-tools-invoice.dto';

describe('ToolsInvoicesService', () => {
  let service: ToolsInvoicesService;

  const mockInvoice: ToolsInvoice = {
    id: 'invoice-uuid',
    idInternal: 'FAC-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    itAssets: [],
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsInvoicesService,
        {
          provide: getRepositoryToken(ToolsInvoice),
          useValue: mockRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<ToolsInvoicesService>(ToolsInvoicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateToolsInvoiceDto = { idInternal: 'FAC-001' };

    it('should create and save a new invoice', async () => {
      mockRepository.create.mockReturnValue(mockInvoice);
      mockRepository.save.mockResolvedValue(mockInvoice);

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockInvoice);
      expect(result).toEqual(mockInvoice);
    });

    it('should throw ConflictException on duplicate idInternal (23505)', async () => {
      mockRepository.create.mockReturnValue(mockInvoice);
      mockRepository.save.mockRejectedValue({
        code: '23505',
        detail: 'Key (idInternal)=(FAC-001) already exists.',
      });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException on other 23505 error', async () => {
      mockRepository.create.mockReturnValue(mockInvoice);
      mockRepository.save.mockRejectedValue({
        code: '23505',
        detail: 'Other constraint',
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on 23503 error', async () => {
      mockRepository.create.mockReturnValue(mockInvoice);
      mockRepository.save.mockRejectedValue({
        code: '23503',
        detail: 'FK violation',
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      mockRepository.create.mockReturnValue(mockInvoice);
      mockRepository.save.mockRejectedValue(new Error('Unknown DB error'));

      await expect(service.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices without query', async () => {
      const filterDto: FilterToolsInvoiceDto = { limit: 10, offset: 0 };
      const invoices = [mockInvoice];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([invoices, 1]);

      const result = await service.findAll(filterDto);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual({
        toolsInvoices: invoices,
        meta: { total: 1, page: 1, lastPage: 1 },
      });
    });

    it('should apply query filter when provided', async () => {
      const filterDto: FilterToolsInvoiceDto = {
        limit: 5,
        offset: 5,
        query: 'FAC',
      };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(filterDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'toolsInvoice.idInternal LIKE :query',
        { query: '%fac%' },
      );
      expect(result.meta.page).toBe(2);
    });
  });

  describe('update', () => {
    it('should update invoice', async () => {
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      mockRepository.update.mockResolvedValue(updateResult);

      const result = await service.update('invoice-uuid', {
        idInternal: 'FAC-002',
      });

      expect(mockRepository.update).toHaveBeenCalledWith('invoice-uuid', {
        idInternal: 'FAC-002',
      });
      expect(result).toEqual(updateResult);
    });

    it('should handle error during update', async () => {
      mockRepository.update.mockRejectedValue({
        code: '23505',
        detail: 'Key (idInternal)=(DUP) already exists.',
      });

      await expect(
        service.update('invoice-uuid', { idInternal: 'DUP' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
