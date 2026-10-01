import { SlaCalculatorService } from './sla-calculator.service';
import { SlaStatus } from '../entities/ticket-sla.entity';
import { TicketPriorityLevel } from 'src/config/params.config';

describe('SlaCalculatorService', () => {
  let service: SlaCalculatorService;

  beforeEach(() => {
    service = new SlaCalculatorService();
  });

  describe('getMaxResolutionHours', () => {
    it('should return 12 for CRITIC priority', () => {
      expect(service.getMaxResolutionHours(TicketPriorityLevel.CRITIC)).toBe(
        12,
      );
    });

    it('should return 24 for HIGH priority', () => {
      expect(service.getMaxResolutionHours(TicketPriorityLevel.HIGH)).toBe(24);
    });

    it('should return 36 for MEDIUM priority', () => {
      expect(service.getMaxResolutionHours(TicketPriorityLevel.MEDIUM)).toBe(
        36,
      );
    });

    it('should return 48 for LOW priority', () => {
      expect(service.getMaxResolutionHours(TicketPriorityLevel.LOW)).toBe(48);
    });

    it('should return default 48 for unknown priority', () => {
      expect(service.getMaxResolutionHours(99)).toBe(48);
    });
  });

  describe('getMaxResponseHours', () => {
    it('should return 2 for CRITIC priority', () => {
      expect(service.getMaxResponseHours(TicketPriorityLevel.CRITIC)).toBe(2);
    });

    it('should return 4 for HIGH priority', () => {
      expect(service.getMaxResponseHours(TicketPriorityLevel.HIGH)).toBe(4);
    });

    it('should return 8 for MEDIUM priority', () => {
      expect(service.getMaxResponseHours(TicketPriorityLevel.MEDIUM)).toBe(8);
    });

    it('should return 16 for LOW priority', () => {
      expect(service.getMaxResponseHours(TicketPriorityLevel.LOW)).toBe(16);
    });

    it('should return default 16 for unknown priority', () => {
      expect(service.getMaxResponseHours(99)).toBe(16);
    });
  });

  describe('getPriorityLabel', () => {
    it('should return correct labels', () => {
      expect(service.getPriorityLabel(TicketPriorityLevel.CRITIC)).toBe(
        'Crítica',
      );
      expect(service.getPriorityLabel(TicketPriorityLevel.HIGH)).toBe('Alta');
      expect(service.getPriorityLabel(TicketPriorityLevel.MEDIUM)).toBe(
        'Media',
      );
      expect(service.getPriorityLabel(TicketPriorityLevel.LOW)).toBe('Baja');
      expect(service.getPriorityLabel(99)).toBe('Normal');
    });
  });

  describe('calculateDeadline', () => {
    it('should calculate the correct deadline date adding maxHours in milliseconds', () => {
      const start = new Date('2026-09-30T10:00:00.000Z');
      const deadline = service.calculateDeadline(start, 12);
      expect(deadline.toISOString()).toBe('2026-09-30T22:00:00.000Z');
    });
  });

  describe('calculateProgress', () => {
    const baseDate = new Date('2026-09-30T10:00:00.000Z');

    it('should return ON_TRACK when time consumed is under 75%', () => {
      const now = new Date('2026-09-30T16:00:00.000Z'); // 6 hours elapsed out of 12 (50%)
      const result = service.calculateProgress(baseDate, 12, now);

      expect(result.elapsedHours).toBe(6);
      expect(result.remainingHours).toBe(6);
      expect(result.percentageConsumed).toBe(50);
      expect(result.isAtRisk).toBe(false);
      expect(result.isBreached).toBe(false);
      expect(result.status).toBe(SlaStatus.ON_TRACK);
    });

    it('should return AT_RISK when time consumed is exactly 75%', () => {
      const now = new Date('2026-09-30T19:00:00.000Z'); // 9 hours elapsed out of 12 (75%)
      const result = service.calculateProgress(baseDate, 12, now);

      expect(result.elapsedHours).toBe(9);
      expect(result.remainingHours).toBe(3);
      expect(result.percentageConsumed).toBe(75);
      expect(result.isAtRisk).toBe(true);
      expect(result.isBreached).toBe(false);
      expect(result.status).toBe(SlaStatus.AT_RISK);
    });

    it('should return AT_RISK when time consumed is between 75% and 99.99%', () => {
      const now = new Date('2026-09-30T20:48:00.000Z'); // 10.8 hours elapsed out of 12 (90%)
      const result = service.calculateProgress(baseDate, 12, now);

      expect(result.percentageConsumed).toBe(90);
      expect(result.isAtRisk).toBe(true);
      expect(result.isBreached).toBe(false);
      expect(result.status).toBe(SlaStatus.AT_RISK);
    });

    it('should return BREACHED when time consumed is >= 100%', () => {
      const now = new Date('2026-09-30T22:00:00.000Z'); // 12 hours elapsed out of 12 (100%)
      const result = service.calculateProgress(baseDate, 12, now);

      expect(result.elapsedHours).toBe(12);
      expect(result.remainingHours).toBe(0);
      expect(result.percentageConsumed).toBe(100);
      expect(result.isAtRisk).toBe(false);
      expect(result.isBreached).toBe(true);
      expect(result.status).toBe(SlaStatus.BREACHED);
    });

    it('should handle overrun when time exceeds deadline (> 100%)', () => {
      const now = new Date('2026-10-01T04:00:00.000Z'); // 18 hours elapsed out of 12 (150%)
      const result = service.calculateProgress(baseDate, 12, now);

      expect(result.elapsedHours).toBe(18);
      expect(result.remainingHours).toBe(0);
      expect(result.percentageConsumed).toBe(150);
      expect(result.isAtRisk).toBe(false);
      expect(result.isBreached).toBe(true);
      expect(result.status).toBe(SlaStatus.BREACHED);
    });
  });
});
