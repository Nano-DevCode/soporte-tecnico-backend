import { Test, TestingModule } from '@nestjs/testing';
import { StartTicketService } from './start-ticket.service';
import {
  DataSource,
  EntityManager,
  OptimisticLockVersionMismatchError,
} from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { TicketsService } from './tickets.service';
import { AttendsService } from 'src/attends/attends.service';
import { I18nService } from 'nestjs-i18n';
import { ConflictException, Logger } from '@nestjs/common';
import { Ticket } from '../entities/ticket.entity';
import { TicketHistory } from 'src/ticket-history/entities/ticket-history.entity';
import { Status } from 'src/ticket-history/entities';

jest.mock('src/common/machine/TicketStateMachine.machine', () => {
  const original = jest.requireActual<
    typeof import('src/common/machine/TicketStateMachine.machine')
  >('src/common/machine/TicketStateMachine.machine');
  return {
    ...original,
    transition: jest.fn().mockReturnValue('EN_PROGRESO'),
  };
});

describe('StartTicketService', () => {
  let service: StartTicketService;

  const mockTransactionManager = {
    save: jest.fn(),
  } as unknown as EntityManager;

  const mockDataSource = {
    transaction: jest
      .fn()
      .mockImplementation(
        async (cb: (manager: EntityManager) => Promise<unknown>) => {
          return cb(mockTransactionManager);
        },
      ),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockTicketHistoryService = {
    findStatusByCodeOrFail: jest.fn(),
    createHistory: jest.fn(),
  };

  const mockTicketsService = {
    findOneByIdOrFail: jest.fn(),
    getCurrentHistory: jest.fn(),
    findOneByIdWithDetailsOrFail: jest.fn(),
  };

  const mockAttendService = {
    startAttention: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartTicketService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: TicketHistoryService, useValue: mockTicketHistoryService },
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: AttendsService, useValue: mockAttendService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<StartTicketService>(StartTicketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería iniciar la atención de un ticket exitosamente', async () => {
    const ticketId = 'ticket-1';

    const mockTicket = { id: ticketId, version: 1 } as Ticket;
    const mockCurrentHistory = {
      status: { code: 'ASIGNADO' },
    } as unknown as TicketHistory;
    const mockNextStatus = {
      id: 'status-2',
      code: 'EN_PROGRESO',
    } as unknown as Status;
    const mockStartedTicket = { id: ticketId, version: 2 } as Ticket;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);
    mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue(
      mockNextStatus,
    );
    mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
      mockStartedTicket,
    );

    const result = await service.startTicket(ticketId);

    expect(mockTicketsService.findOneByIdOrFail).toHaveBeenCalledWith(ticketId);
    expect(mockTicketsService.getCurrentHistory).toHaveBeenCalledWith(
      mockTicket,
    );

    expect(
      mockTicketHistoryService.findStatusByCodeOrFail,
    ).toHaveBeenCalledWith('EN_PROGRESO', mockTransactionManager);
    expect(mockAttendService.startAttention).toHaveBeenCalledWith(
      ticketId,
      mockTransactionManager,
    );
    expect(mockTicketHistoryService.createHistory).toHaveBeenCalledWith(
      mockNextStatus,
      mockTicket,
      mockTransactionManager,
      mockCurrentHistory,
    );
    expect(mockTransactionManager.save).toHaveBeenCalledWith(
      Ticket,
      expect.objectContaining({
        id: ticketId,
        version: mockTicket.version,
      }),
    );
    expect(
      mockTicketsService.findOneByIdWithDetailsOrFail,
    ).toHaveBeenCalledWith(ticketId, mockTransactionManager);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ticket.started',
      mockStartedTicket,
    );
    expect(result).toEqual(mockStartedTicket);
  });

  it('debería lanzar ConflictException si hay OptimisticLockVersionMismatchError', async () => {
    const ticketId = 'ticket-1';

    const mockTicket = { id: ticketId, version: 1 } as Ticket;
    const mockCurrentHistory = {
      status: { code: 'ASIGNADO' },
    } as unknown as TicketHistory;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);

    mockDataSource.transaction.mockRejectedValueOnce(
      new OptimisticLockVersionMismatchError('Ticket', 1, 2),
    );

    await expect(service.startTicket(ticketId)).rejects.toThrow(
      ConflictException,
    );
    expect(mockI18nService.t).toHaveBeenCalledWith(
      'errors.tickets.version_mismatch',
    );
  });

  it('debería propagar otros errores durante la transacción', async () => {
    const ticketId = 'ticket-1';

    const mockTicket = { id: ticketId, version: 1 } as Ticket;
    const mockCurrentHistory = {
      status: { code: 'ASIGNADO' },
    } as unknown as TicketHistory;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);

    const error = new Error('Database error');
    mockDataSource.transaction.mockRejectedValueOnce(error);

    await expect(service.startTicket(ticketId)).rejects.toThrow(error);
  });
});
