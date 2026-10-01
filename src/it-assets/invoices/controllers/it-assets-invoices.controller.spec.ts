import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ItAssetsInvoicesController } from './it-assets-invoices.controller';
import { ItAssetsInvoicesService } from '../services/it-assets-invoices.service';
import { CreateItAssetsInvoiceDto } from '../dto/create-it-assets-invoice.dto';
import { UpdateItAssetsInvoiceDto } from '../dto/update-it-assets-invoice.dto';
import { FilterItAssetsInvoiceDto } from '../dto/filter-it-assets-invoice.dto';

describe('ItAssetsInvoicesController', () => {
  let controller: ItAssetsInvoicesController;
  let service: jest.Mocked<ItAssetsInvoicesService>;

  const mockInvoice = {
    id: 'invoice-uuid-1',
    idInternal: 'FAC-2026-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    itAssets: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItAssetsInvoicesController],
      providers: [
        {
          provide: ItAssetsInvoicesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
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

    controller = module.get<ItAssetsInvoicesController>(
      ItAssetsInvoicesController,
    );
    service = module.get(ItAssetsInvoicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe registrar una factura', async () => {
      const dto: CreateItAssetsInvoiceDto = { idInternal: 'FAC-2026-001' };
      service.create.mockResolvedValue(mockInvoice);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockInvoice);
    });
  });

  describe('findAll', () => {
    it('debe retornar lista de facturas', async () => {
      const filterDto: FilterItAssetsInvoiceDto = { limit: 10, offset: 0 };
      const response = {
        itAssetsInvoices: [mockInvoice],
        meta: { total: 1, page: 1, lastPage: 1 },
      };
      service.findAll.mockResolvedValue(response);

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(response);
    });
  });

  describe('update', () => {
    it('debe actualizar una factura', async () => {
      const dto: UpdateItAssetsInvoiceDto = { idInternal: 'FAC-UPDATED' };
      const updateResult = { generatedMaps: [], raw: [], affected: 1 };
      service.update.mockResolvedValue(updateResult);

      const result = await controller.update('invoice-uuid-1', dto);

      expect(service.update).toHaveBeenCalledWith('invoice-uuid-1', dto);
      expect(result).toEqual(updateResult);
    });
  });
});
