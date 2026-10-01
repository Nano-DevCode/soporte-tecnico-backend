import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, OptimisticLockVersionMismatchError } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConflictException, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AssignTicketService } from './assign-ticket.service';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { AttendsService } from 'src/attends/attends.service';
import { TicketsService } from './tickets.service';
import { StaffService } from 'src/users/services/staff.service';
import { Ticket } from '../entities/ticket.entity';

jest.mock('src/common/machine/TicketStateMachine.machine', () => {
  const original = jest.requireActual<
    typeof import('src/common/machine/TicketStateMachine.machine')
  >('src/common/machine/TicketStateMachine.machine');
  return {
    ...original,
    transition: jest.fn().mockReturnValue('ASIGNADA'),
  };
});

describe('AssignTicketService', () => {
  let service: AssignTicketService;

  const mockTransactionManager = {
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest
      .fn()
      .mockImplementation(
        async (
          cb: (manager: typeof mockTransactionManager) => Promise<unknown>,
        ) => {
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

  const mockAttendsService = {
    attendTicketWithEntities: jest.fn(),
  };

  const mockTicketsService = {
    findOneByIdOrFail: jest.fn(),
    getCurrentHistory: jest.fn(),
    findOneByIdWithDetailsOrFail: jest.fn(),
  };

  const mockStaffService = {
    findAllTechnicalByIds: jest.fn(),
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
        AssignTicketService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: TicketHistoryService, useValue: mockTicketHistoryService },
        { provide: AttendsService, useValue: mockAttendsService },
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: StaffService, useValue: mockStaffService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<AssignTicketService>(AssignTicketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('assignTechnicians', () => {
    it('debería asignar técnicos, generar historial y emitir evento si hay cambios', async () => {
      const mockDto = { technicianIds: ['tech-1', 'tech-2'] };
      const mockTechnicians = [{ id: 'tech-1' }, { id: 'tech-2' }];
      const mockTicket = { id: 'ticket-uuid', version: 1 } as Ticket;
      const mockReloadedTicket = {
        id: 'ticket-uuid',
        status: 'ASIGNADA',
      } as unknown as Ticket;

      mockStaffService.findAllTechnicalByIds.mockResolvedValue(mockTechnicians);
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'NUEVA' },
      });

      mockAttendsService.attendTicketWithEntities.mockResolvedValue({
        inserted: 2,
        deactivated: 0,
      });

      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });
      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockReloadedTicket,
      );

      const result = await service.assignTechnicians('ticket-uuid', mockDto);

      expect(result).toEqual(mockReloadedTicket);
      expect(mockTransactionManager.save).toHaveBeenCalledWith(Ticket, {
        id: mockTicket.id,
        version: mockTicket.version,
        updated_at: expect.any(Date) as Date,
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ticket.assigned',
        mockReloadedTicket,
      );
    });

    it('no debería generar historial ni emitir evento si no hubo cambios ni estado especial', async () => {
      const mockDto = { technicianIds: ['tech-1'] };
      const mockTicket = { id: 'ticket-uuid', version: 1 } as Ticket;
      const mockReloadedTicket = {
        id: 'ticket-uuid',
        status: 'ASIGNADA',
      } as unknown as Ticket;

      mockStaffService.findAllTechnicalByIds.mockResolvedValue([
        { id: 'tech-1' },
      ]);
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'NUEVA' },
      });

      mockAttendsService.attendTicketWithEntities.mockResolvedValue({
        inserted: 0,
        deactivated: 0,
      });

      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockReloadedTicket,
      );

      const result = await service.assignTechnicians('ticket-uuid', mockDto);

      expect(result).toEqual(mockReloadedTicket);
      expect(mockTransactionManager.save).not.toHaveBeenCalled();
      expect(mockTicketHistoryService.createHistory).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('debería generar historial y emitir evento si no hay inserciones pero el status es NO_SOLUCIONADA', async () => {
      const mockDto = { technicianIds: ['tech-1'] };
      const mockTicket = { id: 'ticket-uuid', version: 1 } as Ticket;
      const mockReloadedTicket = {
        id: 'ticket-uuid',
        status: 'ASIGNADA',
      } as unknown as Ticket;

      mockStaffService.findAllTechnicalByIds.mockResolvedValue([
        { id: 'tech-1' },
      ]);
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);

      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'NO_SOLUCIONADA' },
      });

      mockAttendsService.attendTicketWithEntities.mockResolvedValue({
        inserted: 0,
        deactivated: 0,
      });

      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });
      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockReloadedTicket,
      );

      await service.assignTechnicians('ticket-uuid', mockDto);

      expect(mockTransactionManager.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('debería lanzar ConflictException en una sola llamada si ocurre un OptimisticLockVersionMismatchError', async () => {
      const mockDto = { technicianIds: ['tech-1'] };
      const mockTicket = { id: 'ticket-uuid', version: 1 } as Ticket;

      mockStaffService.findAllTechnicalByIds.mockResolvedValue([
        { id: 'tech-1' },
      ]);
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'NUEVA' },
      });

      mockAttendsService.attendTicketWithEntities.mockResolvedValue({
        inserted: 1,
        deactivated: 0,
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      const lockError = new OptimisticLockVersionMismatchError('Ticket', 1, 2);

      mockTransactionManager.save.mockRejectedValueOnce(lockError);

      await expect(
        service.assignTechnicians('ticket-uuid', mockDto),
      ).rejects.toThrow(
        new ConflictException('errors.tickets.version_mismatch'),
      );
    });
  });
});
