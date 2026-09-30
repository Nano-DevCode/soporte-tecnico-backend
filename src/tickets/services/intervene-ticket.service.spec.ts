import { Test, TestingModule } from '@nestjs/testing';
import { InterveneTicketService } from './intervene-ticket.service';
import {
  DataSource,
  EntityManager,
  OptimisticLockVersionMismatchError,
} from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { TicketsService } from './tickets.service';
import { TechnicalReportsService } from '../../technical-reports/technical-reports.service';
import { AttendsService } from 'src/attends/attends.service';
import { TagsService } from 'src/tags/tags.service';
import { I18nService } from 'nestjs-i18n';
import { ConflictException, Logger } from '@nestjs/common';
import { Ticket } from '../entities/ticket.entity';
import { InterveneTicketDto } from '../dto';
import { Tag } from 'src/tags/entities/tag.entity';
import { TicketHistory } from 'src/ticket-history/entities/ticket-history.entity';
import { Status } from 'src/ticket-history/entities';

jest.mock('src/common/machine/TicketStateMachine.machine', () => {
  const original = jest.requireActual<
    typeof import('src/common/machine/TicketStateMachine.machine')
  >('src/common/machine/TicketStateMachine.machine');
  return {
    ...original,
    transition: jest.fn().mockReturnValue('SOLUCIONADO'),
  };
});

describe('InterveneTicketService', () => {
  let service: InterveneTicketService;

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

  const mockTechnicalReportsService = {
    create: jest.fn(),
  };

  const mockAttendService = {
    endAttention: jest.fn(),
  };

  const mockTagsService = {
    bulkFindOrCreate: jest.fn(),
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
        InterveneTicketService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: TicketHistoryService, useValue: mockTicketHistoryService },
        { provide: TicketsService, useValue: mockTicketsService },
        {
          provide: TechnicalReportsService,
          useValue: mockTechnicalReportsService,
        },
        { provide: AttendsService, useValue: mockAttendService },
        { provide: TagsService, useValue: mockTagsService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<InterveneTicketService>(InterveneTicketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería registrar intervención exitosamente con tags e issue_type', async () => {
    const ticketId = 'ticket-1';
    const dto = {
      is_resolved: true,
      tags: [' tag1 ', 'tag2', 'tag1'],
      issue_type: 1,
      description: 'report description',
    } as unknown as InterveneTicketDto;

    const mockTicket = { id: ticketId, version: 1 } as Ticket;
    const mockCurrentHistory = {
      status: { code: 'EN_PROGRESO' },
    } as unknown as TicketHistory;
    const mockNextStatus = {
      id: 'status-2',
      code: 'SOLUCIONADO',
    } as unknown as Status;
    const mockProcessedTicket = { id: ticketId, version: 2 } as Ticket;
    const mockResolvedTags = [{ name: 'TAG1' }, { name: 'TAG2' }] as Tag[];

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);
    mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue(
      mockNextStatus,
    );
    mockTagsService.bulkFindOrCreate.mockResolvedValue(mockResolvedTags);
    mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
      mockProcessedTicket,
    );

    const result = await service.interveneTicket(ticketId, dto);

    expect(mockTicketsService.findOneByIdOrFail).toHaveBeenCalledWith(ticketId);
    expect(mockTicketsService.getCurrentHistory).toHaveBeenCalledWith(
      mockTicket,
    );
    expect(
      mockTicketHistoryService.findStatusByCodeOrFail,
    ).toHaveBeenCalledWith('SOLUCIONADO');

    expect(mockTechnicalReportsService.create).toHaveBeenCalledWith(
      { is_resolved: true, description: 'report description', ticketId },
      mockTransactionManager,
    );
    expect(mockAttendService.endAttention).toHaveBeenCalledWith(
      ticketId,
      mockTransactionManager,
    );
    expect(mockTicketHistoryService.createHistory).toHaveBeenCalledWith(
      mockNextStatus,
      mockTicket,
      mockTransactionManager,
      mockCurrentHistory,
    );
    expect(mockTagsService.bulkFindOrCreate).toHaveBeenCalledWith(
      ['TAG1', 'TAG2'],
      mockTransactionManager,
    );
    expect(mockTransactionManager.save).toHaveBeenCalledWith(
      Ticket,
      expect.objectContaining({
        id: ticketId,
        version: mockTicket.version,
        tags: mockResolvedTags,
        issue_type: { id: 1 },
      }),
    );
    expect(
      mockTicketsService.findOneByIdWithDetailsOrFail,
    ).toHaveBeenCalledWith(ticketId, mockTransactionManager);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ticket.solved',
      mockProcessedTicket,
    );
    expect(result).toEqual(mockProcessedTicket);
  });

  it('debería registrar intervención exitosamente sin tags e issue_type (no resuelto)', async () => {
    const ticketId = 'ticket-1';
    const dto = {
      is_resolved: false,
    } as unknown as InterveneTicketDto;

    const mockTicket = { id: ticketId, version: 1 } as Ticket;
    const mockCurrentHistory = {
      status: { code: 'EN_PROGRESO' },
    } as unknown as TicketHistory;
    const mockNextStatus = {
      id: 'status-2',
      code: 'NO_SOLUCIONADO',
    } as unknown as Status;
    const mockProcessedTicket = { id: ticketId, version: 2 } as Ticket;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);
    mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue(
      mockNextStatus,
    );
    mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
      mockProcessedTicket,
    );

    const result = await service.interveneTicket(ticketId, dto);

    expect(mockTransactionManager.save).toHaveBeenCalledWith(
      Ticket,
      expect.objectContaining({
        id: ticketId,
        version: mockTicket.version,
        tags: [],
      }),
    );
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ticket.no_solved',
      mockProcessedTicket,
    );
    expect(result).toEqual(mockProcessedTicket);
  });

  it('debería lanzar ConflictException si hay OptimisticLockVersionMismatchError', async () => {
    const ticketId = 'ticket-1';
    const dto = { is_resolved: true } as unknown as InterveneTicketDto;

    const mockTicket = { id: ticketId, version: 1 } as Ticket;
    const mockCurrentHistory = {
      status: { code: 'EN_PROGRESO' },
    } as unknown as TicketHistory;
    const mockNextStatus = { id: 's2' } as unknown as Status;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);
    mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue(
      mockNextStatus,
    );

    mockDataSource.transaction.mockRejectedValueOnce(
      new OptimisticLockVersionMismatchError('Ticket', 1, 2),
    );

    await expect(service.interveneTicket(ticketId, dto)).rejects.toThrow(
      ConflictException,
    );
    expect(mockI18nService.t).toHaveBeenCalledWith(
      'errors.tickets.version_mismatch',
    );
  });

  it('debería propagar otros errores durante la transacción', async () => {
    const ticketId = 'ticket-1';
    const dto = { is_resolved: true } as unknown as InterveneTicketDto;

    const mockTicket = { id: ticketId, version: 1 } as Ticket;
    const mockCurrentHistory = {
      status: { code: 'EN_PROGRESO' },
    } as unknown as TicketHistory;
    const mockNextStatus = { id: 's2' } as unknown as Status;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);
    mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue(
      mockNextStatus,
    );

    const error = new Error('Database connection failed');
    mockDataSource.transaction.mockRejectedValueOnce(error);

    await expect(service.interveneTicket(ticketId, dto)).rejects.toThrow(error);
  });
});
