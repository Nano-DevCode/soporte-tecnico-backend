import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { TicketsSeedController } from './tickets-seed.controller';
import { TicketsSeedService } from '../services/tickets-seed.service';

describe('TicketsSeedController', () => {
  let controller: TicketsSeedController;
  let service: jest.Mocked<TicketsSeedService>;

  const mockSeedService = {
    runSeed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsSeedController],
      providers: [
        {
          provide: TicketsSeedService,
          useValue: mockSeedService,
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn((k: string) => k) },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<TicketsSeedController>(TicketsSeedController);
    service = module.get(TicketsSeedService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call runSeed on the service', async () => {
    const expectedResponse = {
      complete: true,
      message: 'Seed de tickets ejecutado exitosamente.',
      totalTickets: 6,
      tickets: ['SOL-2026-0001', 'SOL-2026-0002'],
    };
    mockSeedService.runSeed.mockResolvedValue(expectedResponse);

    const result = await controller.runSeed();

    expect(service.runSeed).toHaveBeenCalled();
    expect(result).toEqual(expectedResponse);
  });
});
