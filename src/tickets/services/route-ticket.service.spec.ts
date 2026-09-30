import { Test, TestingModule } from '@nestjs/testing';
import { RouteTicketService } from './route-ticket.service';
import {
  DataSource,
  EntityManager,
  OptimisticLockVersionMismatchError,
} from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { TicketsService } from './tickets.service';
import { StaffService } from 'src/staff/staff.service';
import { I18nService } from 'nestjs-i18n';
import { ConflictException, Logger } from '@nestjs/common';
import { Ticket } from '../entities/ticket.entity';
import { RouteTicketDto } from '../dto/route-ticket.dto';
import { TicketHistory } from 'src/ticket-history/entities/ticket-history.entity';
import { Staff } from 'src/staff/entities/staff.entity';
import { Status } from 'src/ticket-history/entities';

jest.mock('src/common/machine/TicketStateMachine.machine', () => {
  const original = jest.requireActual<
    typeof import('src/common/machine/TicketStateMachine.machine')
  >('src/common/machine/TicketStateMachine.machine');
  return {
    ...original,
    transition: jest.fn().mockReturnValue('CANALIZADO'),
  };
});

describe('RouteTicketService', () => {
  let service: RouteTicketService;

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

  const mockStaffService = {
    findOne: jest.fn(),
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
        RouteTicketService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: TicketHistoryService, useValue: mockTicketHistoryService },
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: StaffService, useValue: mockStaffService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<RouteTicketService>(RouteTicketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería canalizar un ticket exitosamente actualizando la prioridad', async () => {
    const ticketId = 'ticket-1';
    const dto = {
      coordinatorId: 'staff-2',
      priority: 2,
    };

    const mockTicket = {
      id: ticketId,
      priority: 4,
      coordinator: { id: 'staff-1' },
    } as unknown as Ticket;
    const mockCoordinator = { id: 'staff-2' } as Staff;
    const mockCurrentHistory = {
      status: { code: 'NUEVA' },
    } as unknown as TicketHistory;
    const mockNextStatus = {
      id: 'status-2',
      code: 'CANALIZADO',
    } as unknown as Status;
    const mockSavedTicket = {
      id: ticketId,
      priority: 2,
      coordinator: mockCoordinator,
    } as unknown as Ticket;
    const mockRoutedTicket = { id: ticketId, version: 2 } as Ticket;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockStaffService.findOne.mockResolvedValue(mockCoordinator);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);
    mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue(
      mockNextStatus,
    );
    (mockTransactionManager.save as jest.Mock).mockResolvedValue(
      mockSavedTicket,
    );
    mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
      mockRoutedTicket,
    );

    const result = await service.routeTicket(ticketId, dto);

    expect(mockTicketsService.findOneByIdOrFail).toHaveBeenCalledWith(ticketId);
    expect(mockStaffService.findOne).toHaveBeenCalledWith(dto.coordinatorId);
    expect(mockTicketsService.getCurrentHistory).toHaveBeenCalledWith(
      mockTicket,
    );
    expect(
      mockTicketHistoryService.findStatusByCodeOrFail,
    ).toHaveBeenCalledWith('CANALIZADO');

    expect(mockTransactionManager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        coordinator: mockCoordinator,
        priority: 2,
      }),
    );

    expect(mockTicketHistoryService.createHistory).toHaveBeenCalledWith(
      mockNextStatus,
      mockSavedTicket,
      mockTransactionManager,
      mockCurrentHistory,
    );
    expect(
      mockTicketsService.findOneByIdWithDetailsOrFail,
    ).toHaveBeenCalledWith(ticketId, mockTransactionManager);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ticket.routed',
      mockRoutedTicket,
    );
    expect(result).toEqual(mockRoutedTicket);
  });

  it('debería canalizar un ticket exitosamente manteniendo la prioridad original si no se provee', async () => {
    const ticketId = 'ticket-1';
    const dto = {
      coordinatorId: 'staff-2',
    } as RouteTicketDto;

    const mockTicket = {
      id: ticketId,
      priority: 4,
      coordinator: { id: 'staff-1' },
    } as unknown as Ticket;
    const mockCoordinator = { id: 'staff-2' } as Staff;
    const mockCurrentHistory = {
      status: { code: 'NUEVA' },
    } as unknown as TicketHistory;
    const mockNextStatus = {
      id: 'status-2',
      code: 'CANALIZADO',
    } as unknown as Status;
    const mockSavedTicket = {
      id: ticketId,
      priority: 4,
      coordinator: mockCoordinator,
    } as unknown as Ticket;
    const mockRoutedTicket = { id: ticketId, version: 2 } as Ticket;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockStaffService.findOne.mockResolvedValue(mockCoordinator);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);
    mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue(
      mockNextStatus,
    );
    (mockTransactionManager.save as jest.Mock).mockResolvedValue(
      mockSavedTicket,
    );
    mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
      mockRoutedTicket,
    );

    await service.routeTicket(ticketId, dto);

    expect(mockTransactionManager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        coordinator: mockCoordinator,
        priority: 4,
      }),
    );
  });

  it('debería lanzar ConflictException si el ticket ya está asignado al mismo coordinador', async () => {
    const ticketId = 'ticket-1';
    const dto = { coordinatorId: 'staff-1', priority: 1 };

    const mockTicket = {
      id: ticketId,
      coordinator: { id: 'staff-1' },
    } as unknown as Ticket;
    const mockCoordinator = { id: 'staff-1' } as Staff;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockStaffService.findOne.mockResolvedValue(mockCoordinator);

    await expect(service.routeTicket(ticketId, dto)).rejects.toThrow(
      ConflictException,
    );
    expect(mockI18nService.t).toHaveBeenCalledWith(
      'errors.tickets.already_routed',
    );
  });

  it('debería lanzar ConflictException si hay OptimisticLockVersionMismatchError', async () => {
    const ticketId = 'ticket-1';
    const dto = { coordinatorId: 'staff-2' } as RouteTicketDto;

    const mockTicket = {
      id: ticketId,
      priority: 1,
      coordinator: { id: 'staff-1' },
    } as unknown as Ticket;
    const mockCoordinator = { id: 'staff-2' } as Staff;
    const mockCurrentHistory = {
      status: { code: 'NUEVA' },
    } as unknown as TicketHistory;
    const mockNextStatus = { id: 's2' } as unknown as Status;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockStaffService.findOne.mockResolvedValue(mockCoordinator);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);
    mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue(
      mockNextStatus,
    );

    mockDataSource.transaction.mockRejectedValueOnce(
      new OptimisticLockVersionMismatchError('Ticket', 1, 2),
    );

    await expect(service.routeTicket(ticketId, dto)).rejects.toThrow(
      ConflictException,
    );
    expect(mockI18nService.t).toHaveBeenCalledWith(
      'errors.tickets.version_mismatch',
    );
  });

  it('debería propagar otros errores durante la transacción', async () => {
    const ticketId = 'ticket-1';
    const dto = { coordinatorId: 'staff-2' } as RouteTicketDto;

    const mockTicket = {
      id: ticketId,
      priority: 1,
      coordinator: { id: 'staff-1' },
    } as unknown as Ticket;
    const mockCoordinator = { id: 'staff-2' } as Staff;
    const mockCurrentHistory = {
      status: { code: 'NUEVA' },
    } as unknown as TicketHistory;
    const mockNextStatus = { id: 's2' } as unknown as Status;

    mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
    mockStaffService.findOne.mockResolvedValue(mockCoordinator);
    mockTicketsService.getCurrentHistory.mockReturnValue(mockCurrentHistory);
    mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue(
      mockNextStatus,
    );

    const error = new Error('Database error');
    mockDataSource.transaction.mockRejectedValueOnce(error);

    await expect(service.routeTicket(ticketId, dto)).rejects.toThrow(error);
  });
});
