import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, OptimisticLockVersionMismatchError } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PauseTicketService } from './pause-ticket.service';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { TicketsService } from './tickets.service';
import { FolioCountersService } from 'src/folio-counters/folio-counters.service';
import { PauseReportsService } from 'src/pause-reports/pause-reports.service';
import { Ticket } from '../entities/ticket.entity';
import { PauseTicketDto } from '../dto/pause-ticket.dto';

jest.mock('src/common/machine/TicketStateMachine.machine', () => {
  const original = jest.requireActual<
    typeof import('src/common/machine/TicketStateMachine.machine')
  >('src/common/machine/TicketStateMachine.machine');
  return {
    ...original,
    transition: jest.fn().mockReturnValue('PAUSADA'),
  };
});

describe('PauseTicketService', () => {
  let service: PauseTicketService;
  let dataSource: jest.Mocked<DataSource>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let ticketHistoryService: jest.Mocked<TicketHistoryService>;
  let ticketsService: jest.Mocked<TicketsService>;
  let folioCounterService: jest.Mocked<FolioCountersService>;
  let pauseReportsService: jest.Mocked<PauseReportsService>;

  const mockTicket = {
    id: 'ticket-uuid',
    version: 1,
    internal_folio: null,
    jefe_depto: {
      department: {
        acronym: 'SISTEMAS',
      },
    },
  } as unknown as Ticket;

  const mockHistory = {
    id: 'history-uuid',
    status: { code: 'ATENDIENDO' },
  };

  const mockNextStatus = {
    id: 'status-uuid',
    code: 'PAUSADA',
  };

  const mockTransactionManager = {
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PauseTicketService,
        {
          provide: DataSource,
          useValue: {
            transaction: jest
              .fn()
              .mockImplementation((cb: (mgr: unknown) => unknown) =>
                cb(mockTransactionManager),
              ),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: TicketHistoryService,
          useValue: {
            findStatusByCodeOrFail: jest.fn().mockResolvedValue(mockNextStatus),
            createHistory: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: TicketsService,
          useValue: {
            findOneByIdOrFail: jest.fn().mockResolvedValue(mockTicket),
            getCurrentHistory: jest.fn().mockReturnValue(mockHistory),
          },
        },
        {
          provide: FolioCountersService,
          useValue: {
            generateNewFolio: jest.fn().mockResolvedValue('INT-001'),
          },
        },
        {
          provide: PauseReportsService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'pause-report-uuid' }),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<PauseTicketService>(PauseTicketService);
    dataSource = module.get(DataSource);
    eventEmitter = module.get(EventEmitter2);
    ticketHistoryService = module.get(TicketHistoryService);
    ticketsService = module.get(TicketsService);
    folioCounterService = module.get(FolioCountersService);
    pauseReportsService = module.get(PauseReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('pauseTicket', () => {
    it('should pause ticket and generate folio if absent', async () => {
      const pausedTicketMock = {
        ...mockTicket,
        internal_folio: 'INT-001',
      };

      (ticketsService.findOneByIdOrFail as jest.Mock)
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(pausedTicketMock);

      const pauseDto: PauseTicketDto = {
        reason: 'Esperando refacción',
      };

      const result = await service.pauseTicket('ticket-uuid', pauseDto);

      expect(ticketsService.findOneByIdOrFail).toHaveBeenCalledWith(
        'ticket-uuid',
      );
      expect(folioCounterService.generateNewFolio).toHaveBeenCalledWith(
        'SISTEMAS',
        mockTransactionManager,
      );
      expect(pauseReportsService.create).toHaveBeenCalledWith(
        { reason: 'Esperando refacción', ticketId: 'ticket-uuid' },
        mockTransactionManager,
      );
      expect(ticketHistoryService.createHistory).toHaveBeenCalledWith(
        mockNextStatus,
        mockTicket,
        mockTransactionManager,
        mockHistory,
      );
      expect(mockTransactionManager.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'ticket.paused',
        pausedTicketMock,
      );
      expect(result).toEqual(pausedTicketMock);
    });

    it('should throw ConflictException on OptimisticLockVersionMismatchError', async () => {
      (dataSource.transaction as jest.Mock).mockRejectedValueOnce(
        new OptimisticLockVersionMismatchError('Ticket', 1, 2),
      );

      const pauseDto: PauseTicketDto = {
        reason: 'Test',
      };

      await expect(
        service.pauseTicket('ticket-uuid', pauseDto),
      ).rejects.toThrow(ConflictException);
    });
  });
});
