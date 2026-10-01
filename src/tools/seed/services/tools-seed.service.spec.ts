import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ToolsSeedService } from './tools-seed.service';
import { ToolsService } from 'src/tools/services/tools.service';
import { ToolsBrandsService } from 'src/tools/brands/services/tools-brands.service';
import { ToolsModelsService } from 'src/tools/models/services/tools-models.service';
import { ToolsStatusService } from 'src/tools/status/services/tools-status.service';
import { ToolsTypesService } from 'src/tools/types/services/tools-types.service';
import { ToolsInvoicesService } from 'src/tools/invoices/services/tools-invoices.service';

describe('ToolsSeedService', () => {
  let service: ToolsSeedService;

  const mockToolsService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const mockToolsBrandsService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const mockToolsModelsService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const mockToolsStatusService = {
    findAll: jest.fn(),
    seed: jest.fn(),
  };

  const mockToolsTypesService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const mockToolsInvoicesService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsSeedService,
        { provide: ToolsService, useValue: mockToolsService },
        { provide: ToolsBrandsService, useValue: mockToolsBrandsService },
        { provide: ToolsModelsService, useValue: mockToolsModelsService },
        { provide: ToolsStatusService, useValue: mockToolsStatusService },
        { provide: ToolsTypesService, useValue: mockToolsTypesService },
        {
          provide: ToolsInvoicesService,
          useValue: mockToolsInvoicesService,
        },
      ],
    }).compile();

    service = module.get<ToolsSeedService>(ToolsSeedService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException if tools already exist', async () => {
    mockToolsService.findAll.mockResolvedValue({
      tools: [{ id: 'tool-1' }],
      meta: { total: 1, page: 1, lastPage: 1 },
    });

    await expect(service.runSeed()).rejects.toThrow(ConflictException);
    expect(mockToolsService.create).not.toHaveBeenCalled();
  });

  it('should run seed successfully when no tools exist', async () => {
    mockToolsService.findAll.mockResolvedValue({
      tools: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    });

    mockToolsStatusService.findAll
      .mockResolvedValueOnce({ toolsStatus: [] })
      .mockResolvedValueOnce({
        toolsStatus: [
          { id: 'status-1', name: 'Excelente' },
          { id: 'status-2', name: 'Buena' },
        ],
      });
    mockToolsStatusService.seed.mockResolvedValue({ complete: true });

    mockToolsTypesService.findAll.mockResolvedValue({
      toolsTypes: [],
      meta: { total: 0 },
    });
    mockToolsTypesService.create.mockImplementation(
      ({ name }: { name: string }) =>
        Promise.resolve({ id: `type-${name.toLowerCase()}`, name }),
    );

    mockToolsInvoicesService.findAll.mockResolvedValue({
      toolsInvoices: [],
      meta: { total: 0 },
    });
    mockToolsInvoicesService.create.mockImplementation(
      ({ idInternal }: { idInternal: string }) =>
        Promise.resolve({ id: `inv-${idInternal.toLowerCase()}`, idInternal }),
    );

    mockToolsBrandsService.findAll.mockResolvedValue({
      toolsBrands: [],
      meta: { total: 0 },
    });
    mockToolsBrandsService.create.mockImplementation(
      ({ name }: { name: string }) =>
        Promise.resolve({ id: `brand-${name.toLowerCase()}`, name }),
    );

    mockToolsModelsService.findAll.mockResolvedValue({
      toolsModels: [],
      meta: { total: 0 },
    });
    mockToolsModelsService.create.mockImplementation(
      ({ name, brandId }: { name: string; brandId: string }) =>
        Promise.resolve({ id: `model-${name.toLowerCase()}`, name, brandId }),
    );

    mockToolsService.create.mockResolvedValue({ id: 'new-tool-uuid' });

    const result = await service.runSeed();

    expect(result.message).toBe('Seed de herramientas ejecutado correctamente');
    expect(result.totalToolsCreated).toBeGreaterThan(0);
    expect(mockToolsStatusService.seed).toHaveBeenCalled();
    expect(mockToolsService.create).toHaveBeenCalled();
  });
});
