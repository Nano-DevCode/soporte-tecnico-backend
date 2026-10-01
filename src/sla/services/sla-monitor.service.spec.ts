import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SlaMonitorService } from './sla-monitor.service';
import { SlaCalculatorService } from './sla-calculator.service';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { SlaStatus, TicketSla } from '../entities/ticket-sla.entity';
import { TelegramBotService } from 'src/telegram-bot/telegram-bot.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { GeneralWebsocketGateway } from 'src/general-websocket/general-websocket.gateway';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';

describe('SlaMonitorService', () => {
  let service: SlaMonitorService;
  let mockTicketRepository: Record<string, jest.Mock>;
  let mockTicketSlaRepository: Record<string, jest.Mock>;
  let mockTelegramBotService: Record<string, jest.Mock>;
  let mockNotificationsService: Record<string, jest.Mock>;
  let mockWebsocketGateway: Record<string, jest.Mock>;
  let mockEventEmitter: Record<string, jest.Mock>;

  const createMockTicket = (
    id: string,
    priority: number,
    statusCode: string,
    createdHoursAgo: number,
  ) => {
    const created_at = new Date(Date.now() - createdHoursAgo * 3600 * 1000);
    return {
      id,
      folio: `FOLIO-${id}`,
      priority,
      created_at,
      coordinator: {
        id: 'coord-1',
        name: 'Coordinador',
        paternalSurname: 'Prueba',
        user: { id: 'user-coord-1' },
        idTelegram: '12345678',
      },
      jefe_depto: {
        department: { name: 'Sistemas' },
      },
      attends: [
        {
          is_active: true,
          technician: {
            id: 'tech-1',
            name: 'Tecnico',
            paternalSurname: 'Uno',
            user: { id: 'user-tech-1' },
            idTelegram: '87654321',
          },
        },
      ],
      ticket_histories: [
        {
          created_at,
          status: { code: statusCode },
        },
      ],
      pause_report: null,
    };
  };

  beforeEach(async () => {
    mockTicketRepository = {
      createQueryBuilder: jest.fn(),
    };

    mockTicketSlaRepository = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((data) => ({ ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    };

    mockTelegramBotService = {
      sendNotification: jest.fn().mockResolvedValue({ success: true }),
    };

    mockNotificationsService = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    mockWebsocketGateway = {
      emitToUser: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaMonitorService,
        SlaCalculatorService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepository,
        },
        {
          provide: getRepositoryToken(TicketSla),
          useValue: mockTicketSlaRepository,
        },
        {
          provide: TelegramBotService,
          useValue: mockTelegramBotService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: GeneralWebsocketGateway,
          useValue: mockWebsocketGateway,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<SlaMonitorService>(SlaMonitorService);
  });

  const setupQueryBuilderMock = (tickets: unknown[]) => {
    const qb: Record<string, jest.Mock> = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(tickets),
    };
    mockTicketRepository.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  describe('runSlaCheck', () => {
    it('should identify on-track tickets and not send alerts', async () => {
      // Priority 1 (CRITIC = 12h), created 2h ago (16.6% consumed) -> ON_TRACK
      const ticket = createMockTicket('t1', 1, TicketStatus.ATENDIENDO, 2);
      setupQueryBuilderMock([ticket]);
      mockTicketSlaRepository.findOne.mockResolvedValue(null);

      const result = await service.runSlaCheck();

      expect(result.checked).toBe(1);
      expect(result.onTrack).toBe(1);
      expect(result.atRisk).toBe(0);
      expect(result.breached).toBe(0);
      expect(result.warningAlertsSent).toBe(0);
      expect(result.breachAlertsSent).toBe(0);
      expect(mockTelegramBotService.sendNotification).not.toHaveBeenCalled();
      expect(mockTicketSlaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ slaStatus: SlaStatus.ON_TRACK }),
      );
    });

    it('should detect AT_RISK tickets and send warning alerts via Telegram and In-App', async () => {
      // Priority 1 (12h), created 10h ago (83.3% consumed) -> AT_RISK
      const ticket = createMockTicket('t2', 1, TicketStatus.ATENDIENDO, 10);
      setupQueryBuilderMock([ticket]);
      mockTicketSlaRepository.findOne.mockResolvedValue({
        ticketId: 't2',
        warningAlertSentAt: null,
      });

      const result = await service.runSlaCheck();

      expect(result.checked).toBe(1);
      expect(result.atRisk).toBe(1);
      expect(result.warningAlertsSent).toBe(1);
      expect(mockTelegramBotService.sendNotification).toHaveBeenCalledTimes(2); // coordinator + technician
      expect(mockNotificationsService.create).toHaveBeenCalledTimes(2);
      expect(mockWebsocketGateway.emitToUser).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'sla.warning',
        expect.objectContaining({ ticketId: 't2' }),
      );
    });

    it('should deduplicate warning alerts if warningAlertSentAt is already set', async () => {
      const ticket = createMockTicket('t3', 1, TicketStatus.ATENDIENDO, 10);
      setupQueryBuilderMock([ticket]);
      mockTicketSlaRepository.findOne.mockResolvedValue({
        ticketId: 't3',
        warningAlertSentAt: new Date(), // Already alerted
      });

      const result = await service.runSlaCheck();

      expect(result.checked).toBe(1);
      expect(result.atRisk).toBe(1);
      expect(result.warningAlertsSent).toBe(0);
      expect(mockTelegramBotService.sendNotification).not.toHaveBeenCalled();
    });

    it('should detect BREACHED tickets and send breach alerts', async () => {
      // Priority 1 (12h), created 15h ago (125% consumed) -> BREACHED
      const ticket = createMockTicket('t4', 1, TicketStatus.ATENDIENDO, 15);
      setupQueryBuilderMock([ticket]);
      mockTicketSlaRepository.findOne.mockResolvedValue({
        ticketId: 't4',
        breachedAlertSentAt: null,
      });

      const result = await service.runSlaCheck();

      expect(result.checked).toBe(1);
      expect(result.breached).toBe(1);
      expect(result.breachAlertsSent).toBe(1);
      expect(mockTelegramBotService.sendNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationsService.create).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'sla.breached',
        expect.objectContaining({ ticketId: 't4' }),
      );
    });

    it('should deduplicate breach alerts if breachedAlertSentAt is already set', async () => {
      const ticket = createMockTicket('t5', 1, TicketStatus.ATENDIENDO, 15);
      setupQueryBuilderMock([ticket]);
      mockTicketSlaRepository.findOne.mockResolvedValue({
        ticketId: 't5',
        breachedAlertSentAt: new Date(), // Already alerted
      });

      const result = await service.runSlaCheck();

      expect(result.checked).toBe(1);
      expect(result.breached).toBe(1);
      expect(result.breachAlertsSent).toBe(0);
      expect(mockTelegramBotService.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should return aggregated SLA metrics correctly', async () => {
      const t1 = createMockTicket('t1', 1, TicketStatus.RECIBIDA, 2); // on track
      const t2 = createMockTicket('t2', 2, TicketStatus.ASIGNADA, 20); // at risk (20h of 24h = 83%)
      const t3 = createMockTicket('t3', 1, TicketStatus.ATENDIENDO, 14); // breached (14h of 12h = 116%)

      setupQueryBuilderMock([t1, t2, t3]);

      const metrics = await service.getMetrics();

      expect(metrics.totalActive).toBe(3);
      expect(metrics.onTrack).toBe(1);
      expect(metrics.atRisk).toBe(1);
      expect(metrics.breached).toBe(1);
      expect(metrics.compliancePercentage).toBe(66.67);
      expect(metrics.byPriority).toHaveLength(4);
    });
  });

  describe('getActiveTicketsWithSla', () => {
    it('should filter by SLA status and paginate results', async () => {
      const t1 = createMockTicket('t1', 1, TicketStatus.RECIBIDA, 2); // on track
      const t2 = createMockTicket('t2', 1, TicketStatus.ATENDIENDO, 10); // at risk

      setupQueryBuilderMock([t1, t2]);

      const result = await service.getActiveTicketsWithSla({
        status: SlaStatus.AT_RISK,
        page: 1,
        limit: 10,
      });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].ticketId).toBe('t2');
      expect(result.data[0].slaStatus).toBe(SlaStatus.AT_RISK);
    });
  });

  describe('handleCronCheck', () => {
    it('should execute runSlaCheck smoothly without throwing', async () => {
      setupQueryBuilderMock([]);
      await expect(service.handleCronCheck()).resolves.not.toThrow();
    });
  });
});
