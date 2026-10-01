import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SlaTicketListener } from './sla-ticket.listener';
import { SlaCalculatorService } from '../services/sla-calculator.service';
import { SlaStatus, TicketSla } from '../entities/ticket-sla.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';

describe('SlaTicketListener', () => {
  let listener: SlaTicketListener;
  let mockTicketSlaRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockTicketSlaRepository = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d })),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaTicketListener,
        SlaCalculatorService,
        {
          provide: getRepositoryToken(TicketSla),
          useValue: mockTicketSlaRepository,
        },
      ],
    }).compile();

    listener = module.get<SlaTicketListener>(SlaTicketListener);
  });

  describe('handleTicketCreated', () => {
    it('should create TicketSla tracking for new ticket', async () => {
      const ticket = {
        id: 't-123',
        folio: 'T-001',
        priority: 1,
      } as Ticket;

      mockTicketSlaRepository.findOne.mockResolvedValue(null);

      await listener.handleTicketCreated(ticket);

      expect(mockTicketSlaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 't-123',
          priority: 1,
          maxResolutionHours: 12,
          slaStatus: SlaStatus.ON_TRACK,
        }),
      );
      expect(mockTicketSlaRepository.save).toHaveBeenCalled();
    });

    it('should not duplicate if TicketSla already exists', async () => {
      const ticket = { id: 't-123' } as Ticket;
      mockTicketSlaRepository.findOne.mockResolvedValue({ id: 'sla-existing' });

      await listener.handleTicketCreated(ticket);

      expect(mockTicketSlaRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('handleTicketStarted', () => {
    it('should set firstRespondedAt timestamp', async () => {
      const ticket = { id: 't-123' } as Ticket;
      const sla = { id: 'sla-1', ticketId: 't-123', firstRespondedAt: null };
      mockTicketSlaRepository.findOne.mockResolvedValue(sla);

      await listener.handleTicketStarted(ticket);

      expect(sla.firstRespondedAt).toBeInstanceOf(Date);
      expect(mockTicketSlaRepository.save).toHaveBeenCalledWith(sla);
    });
  });

  describe('handleTicketResolved', () => {
    it('should mark status as COMPLIANT if resolved within deadline', async () => {
      const createdAt = new Date(Date.now() - 2 * 3600 * 1000); // 2 hours ago
      const ticket = { id: 't-123', created_at: createdAt } as Ticket;
      const sla = {
        id: 'sla-1',
        ticketId: 't-123',
        maxResolutionHours: 12,
        resolvedAt: null,
      };
      mockTicketSlaRepository.findOne.mockResolvedValue(sla);

      await listener.handleTicketResolved(ticket);

      expect(sla.resolvedAt).toBeInstanceOf(Date);
      expect(mockTicketSlaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          slaStatus: SlaStatus.COMPLIANT,
        }),
      );
    });

    it('should mark status as BREACHED if resolved past deadline', async () => {
      const createdAt = new Date(Date.now() - 15 * 3600 * 1000); // 15 hours ago
      const ticket = { id: 't-123', created_at: createdAt } as Ticket;
      const sla = {
        id: 'sla-1',
        ticketId: 't-123',
        maxResolutionHours: 12,
        resolvedAt: null,
      };
      mockTicketSlaRepository.findOne.mockResolvedValue(sla);

      await listener.handleTicketResolved(ticket);

      expect(mockTicketSlaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          slaStatus: SlaStatus.BREACHED,
        }),
      );
    });
  });
});
