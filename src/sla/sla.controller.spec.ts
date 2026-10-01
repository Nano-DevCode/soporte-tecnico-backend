import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { SlaController } from './sla.controller';
import { SlaMonitorService } from './services/sla-monitor.service';
import { SlaStatus } from './entities/ticket-sla.entity';

describe('SlaController', () => {
  let controller: SlaController;
  let mockSlaMonitorService: any;

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    mockSlaMonitorService = {
      getMetrics: jest.fn(),
      getActiveTicketsWithSla: jest.fn(),
      runSlaCheck: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlaController],
      providers: [
        {
          provide: SlaMonitorService,
          useValue: mockSlaMonitorService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<SlaController>(SlaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return SLA metrics from service', async () => {
      const mockMetrics = {
        totalActive: 10,
        onTrack: 8,
        atRisk: 1,
        breached: 1,
        compliancePercentage: 90.0,
        byPriority: [],
      };
      mockSlaMonitorService.getMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getMetrics();
      expect(result).toEqual(mockMetrics);
      expect(mockSlaMonitorService.getMetrics).toHaveBeenCalled();
    });
  });

  describe('getTickets', () => {
    it('should return paginated SLA tickets from service', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockSlaMonitorService.getActiveTicketsWithSla.mockResolvedValue(
        mockResult,
      );

      const result = await controller.getTickets({
        page: 1,
        limit: 10,
        status: SlaStatus.AT_RISK,
      });

      expect(result).toEqual(mockResult);
      expect(
        mockSlaMonitorService.getActiveTicketsWithSla,
      ).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: SlaStatus.AT_RISK,
      });
    });
  });

  describe('evaluateNow', () => {
    it('should trigger on-demand SLA evaluation', async () => {
      const mockEvalResult = {
        checked: 5,
        onTrack: 3,
        atRisk: 1,
        breached: 1,
        warningAlertsSent: 1,
        breachAlertsSent: 0,
      };
      mockSlaMonitorService.runSlaCheck.mockResolvedValue(mockEvalResult);

      const result = await controller.evaluateNow();
      expect(result).toEqual(mockEvalResult);
      expect(mockSlaMonitorService.runSlaCheck).toHaveBeenCalled();
    });
  });
});
