import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ItAssetsSeedController } from './it-assets-seed.controller';
import { ItAssetsSeedService } from '../services/it-assets-seed.service';

describe('ItAssetsSeedController', () => {
  let controller: ItAssetsSeedController;
  let service: jest.Mocked<ItAssetsSeedService>;

  const mockSeedService = {
    runSeed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItAssetsSeedController],
      providers: [
        {
          provide: ItAssetsSeedService,
          useValue: mockSeedService,
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn((k: string) => k) },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ItAssetsSeedController>(ItAssetsSeedController);
    service = module.get(ItAssetsSeedService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call runSeed on the service', async () => {
    const expectedResponse = {
      message: 'Seed de activos de TI ejecutado correctamente',
      totalAssetsCreated: 10,
    };
    mockSeedService.runSeed.mockResolvedValue(expectedResponse);

    const result = await controller.runSeed();

    expect(service.runSeed).toHaveBeenCalled();
    expect(result).toEqual(expectedResponse);
  });
});
