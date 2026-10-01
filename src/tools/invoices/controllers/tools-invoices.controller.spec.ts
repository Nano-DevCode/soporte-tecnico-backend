import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { UpdateResult } from 'typeorm';
import { ToolsInvoicesController } from './tools-invoices.controller';
import { ToolsInvoicesService } from '../services/tools-invoices.service';
import { CreateToolsInvoiceDto } from '../dto/create-tools-invoice.dto';
import { UpdateToolsInvoiceDto } from '../dto/update-tools-invoice.dto';
import { FilterToolsInvoiceDto } from '../dto/filter-tools-invoice.dto';
import { ToolsInvoice } from '../entities/tools-invoice.entity';

describe('ToolsInvoicesController', () => {
  let controller: ToolsInvoicesController;
  let service: jest.Mocked<ToolsInvoicesService>;

  const mockToolsInvoicesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsInvoicesController],
      providers: [
        {
          provide: ToolsInvoicesService,
          useValue: mockToolsInvoicesService,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ToolsInvoicesController>(ToolsInvoicesController);
    service = module.get(ToolsInvoicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create with dto', async () => {
    const dto: CreateToolsInvoiceDto = { idInternal: 'FAC-100' };
    const createdInvoice = {
      id: '1',
      idInternal: 'FAC-100',
      createdAt: new Date(),
      updatedAt: new Date(),
      itAssets: [],
    } as ToolsInvoice;
    mockToolsInvoicesService.create.mockResolvedValue(createdInvoice);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(createdInvoice);
  });

  it('should call service.findAll with filterDto', async () => {
    const filterDto: FilterToolsInvoiceDto = { limit: 10, offset: 0 };
    const paginatedResult = {
      toolsInvoices: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    };
    mockToolsInvoicesService.findAll.mockResolvedValue(paginatedResult);

    const result = await controller.findAll(filterDto);

    expect(service.findAll).toHaveBeenCalledWith(filterDto);
    expect(result.meta.total).toBe(0);
  });

  it('should call service.update with id and dto', async () => {
    const dto: UpdateToolsInvoiceDto = { idInternal: 'FAC-200' };
    const updateResult: UpdateResult = {
      affected: 1,
      raw: {},
      generatedMaps: [],
    };
    mockToolsInvoicesService.update.mockResolvedValue(updateResult);

    const result = await controller.update('invoice-uuid-1', dto);

    expect(service.update).toHaveBeenCalledWith('invoice-uuid-1', dto);
    expect(result).toEqual(updateResult);
  });
});
