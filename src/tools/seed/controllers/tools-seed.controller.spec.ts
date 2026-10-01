import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ToolsSeedController } from './tools-seed.controller';
import { ToolsSeedService } from '../services/tools-seed.service';

describe('ToolsSeedController', () => {
  let controller: ToolsSeedController;
  let service: jest.Mocked<ToolsSeedService>;

  const mockSeedService = {
    runSeed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsSeedController],
      providers: [
        {
          provide: ToolsSeedService,
          useValue: mockSeedService,
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn((k: string) => k) },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ToolsSeedController>(ToolsSeedController);
    service = module.get(ToolsSeedService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call runSeed on the service', async () => {
    const expectedResponse = {
      message: 'Seed de herramientas ejecutado correctamente',
      totalToolsCreated: 10,
    };
    mockSeedService.runSeed.mockResolvedValue(expectedResponse);

    const result = await controller.runSeed();

    expect(service.runSeed).toHaveBeenCalled();
    expect(result).toEqual(expectedResponse);
  });
});
