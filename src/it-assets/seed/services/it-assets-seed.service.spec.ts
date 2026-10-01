import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ItAssetsSeedService } from './it-assets-seed.service';
import { ItAssetsService } from 'src/it-assets/services/it-assets.service';
import { ItAssetsBrandsService } from 'src/it-assets/brands/services/it-assets-brands.service';
import { ItAssetsModelsService } from 'src/it-assets/models/services/it-assets-models.service';
import { ItAssetsStatusService } from 'src/it-assets/status/services/it-assets-status.service';
import { ItAssetsTypesService } from 'src/it-assets/types/services/it-assets-types.service';
import { ItAssetsInvoicesService } from 'src/it-assets/invoices/services/it-assets-invoices.service';

describe('ItAssetsSeedService', () => {
  let service: ItAssetsSeedService;

  const mockItAssetsService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const mockItAssetsBrandsService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const mockItAssetsModelsService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const mockItAssetsStatusService = {
    findAll: jest.fn(),
    seed: jest.fn(),
  };

  const mockItAssetsTypesService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  const mockItAssetsInvoicesService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItAssetsSeedService,
        { provide: ItAssetsService, useValue: mockItAssetsService },
        { provide: ItAssetsBrandsService, useValue: mockItAssetsBrandsService },
        { provide: ItAssetsModelsService, useValue: mockItAssetsModelsService },
        { provide: ItAssetsStatusService, useValue: mockItAssetsStatusService },
        { provide: ItAssetsTypesService, useValue: mockItAssetsTypesService },
        {
          provide: ItAssetsInvoicesService,
          useValue: mockItAssetsInvoicesService,
        },
      ],
    }).compile();

    service = module.get<ItAssetsSeedService>(ItAssetsSeedService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException if assets already exist', async () => {
    mockItAssetsService.findAll.mockResolvedValue({
      itAssets: [{ id: 'asset-1' }],
      meta: { total: 1, page: 1, lastPage: 1 },
    });

    await expect(service.runSeed()).rejects.toThrow(ConflictException);
    expect(mockItAssetsService.create).not.toHaveBeenCalled();
  });

  it('should run seed successfully when no assets exist', async () => {
    mockItAssetsService.findAll.mockResolvedValue({
      itAssets: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    });

    mockItAssetsStatusService.findAll
      .mockResolvedValueOnce({ itAssetsStatus: [] })
      .mockResolvedValueOnce({
        itAssetsStatus: [
          { id: 'status-1', name: 'Excelente' },
          { id: 'status-2', name: 'Buena' },
        ],
      });
    mockItAssetsStatusService.seed.mockResolvedValue({ complete: true });

    mockItAssetsTypesService.findAll.mockResolvedValue({
      itAssetsTypes: [],
      meta: { total: 0 },
    });
    mockItAssetsTypesService.create.mockImplementation(
      ({ name }: { name: string }) =>
        Promise.resolve({ id: `type-${name.toLowerCase()}`, name }),
    );

    mockItAssetsInvoicesService.findAll.mockResolvedValue({
      itAssetsInvoices: [],
      meta: { total: 0 },
    });
    mockItAssetsInvoicesService.create.mockImplementation(
      ({ idInternal }: { idInternal: string }) =>
        Promise.resolve({ id: `inv-${idInternal.toLowerCase()}`, idInternal }),
    );

    mockItAssetsBrandsService.findAll.mockResolvedValue({
      itAssetsBrands: [],
      meta: { total: 0 },
    });
    mockItAssetsBrandsService.create.mockImplementation(
      ({ name }: { name: string }) =>
        Promise.resolve({ id: `brand-${name.toLowerCase()}`, name }),
    );

    mockItAssetsModelsService.findAll.mockResolvedValue({
      itAssetsModels: [],
      meta: { total: 0 },
    });
    mockItAssetsModelsService.create.mockImplementation(
      ({ name, brandId }: { name: string; brandId: string }) =>
        Promise.resolve({ id: `model-${name.toLowerCase()}`, name, brandId }),
    );

    mockItAssetsService.create.mockResolvedValue({ id: 'new-asset-uuid' });

    const result = await service.runSeed();

    expect(result.message).toBe(
      'Seed de activos de TI ejecutado correctamente',
    );
    expect(result.totalAssetsCreated).toBeGreaterThan(0);
    expect(mockItAssetsStatusService.seed).toHaveBeenCalled();
    expect(mockItAssetsService.create).toHaveBeenCalled();
  });
});
