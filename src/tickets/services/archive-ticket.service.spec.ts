import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, OptimisticLockVersionMismatchError } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ArchiveTicketService } from './archive-ticket.service';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { TicketsService } from './tickets.service';
import { ResponseSignatureService } from '../../response-signature/response-signature.service';
import { UsersService } from '../../users/users.service';
import { ResponsesService } from '../../responses/responses.service';
import { ResponsePdfsService } from '../../response-pdfs/response-pdfs.service';
import { User } from 'src/users/entities/user.entity';
import { Ticket } from '../entities/ticket.entity';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { IPdfResult } from 'src/common/interfaces/interface';

jest.mock('src/common/machine/TicketStateMachine.machine', () => {
  const original = jest.requireActual<
    typeof import('src/common/machine/TicketStateMachine.machine')
  >('src/common/machine/TicketStateMachine.machine');
  return {
    ...original,
    transition: jest.fn().mockReturnValue('ARCHIVADO'),
  };
});

describe('ArchiveTicketService', () => {
  let service: ArchiveTicketService;

  const mockTransactionManager = {
    save: jest.fn(),
    create: jest
      .fn()
      .mockImplementation(<T>(entity: unknown, dto: T): T => dto),
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

  const mockTicketsService = {
    findOneByIdOrFail: jest.fn(),
    getCurrentHistory: jest.fn(),
    findAllDetailsByIdOrFail: jest.fn(),
    findOneByIdWithDetailsOrFail: jest.fn(),
  };

  const mockResponseSignatureService = {
    signResponse: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockResponsesService = {
    findByTicketIdOrFail: jest.fn(),
  };

  const mockResponsePdfsService = {
    pdfResponseBucket: jest.fn(),
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
        ArchiveTicketService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: TicketHistoryService, useValue: mockTicketHistoryService },
        { provide: TicketsService, useValue: mockTicketsService },
        {
          provide: ResponseSignatureService,
          useValue: mockResponseSignatureService,
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ResponsesService, useValue: mockResponsesService },
        { provide: ResponsePdfsService, useValue: mockResponsePdfsService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<ArchiveTicketService>(ArchiveTicketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('archiveTicket', () => {
    it('debería archivar el ticket exitosamente y emitir el evento', async () => {
      const mockUser = { id: 'user-uuid' } as unknown as User;
      const mockJefePlaneacion = { rfc: 'RFC123' };

      mockUsersService.findOne.mockResolvedValue({
        staff: mockJefePlaneacion,
        role: { name: ValidRole.planning },
      });

      const mockTicket = {
        id: 'ticket-uuid',
        updated_at: new Date(),
      } as Ticket;
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);

      const mockHistory = { status: { code: 'FINALIZADO' } };
      mockTicketsService.getCurrentHistory.mockReturnValue(mockHistory);

      const mockNextStatus = { id: 'status-uuid', code: 'ARCHIVADO' };
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue(
        mockNextStatus,
      );

      mockTransactionManager.save.mockResolvedValue(mockTicket);

      const mockResponse = { id: 'response-uuid' };
      mockResponsesService.findByTicketIdOrFail.mockResolvedValue(mockResponse);

      const mockTicketCompleted = { id: 'ticket-uuid', folio: '123' } as Ticket;
      mockTicketsService.findAllDetailsByIdOrFail.mockResolvedValue(
        mockTicketCompleted,
      );

      const mockPdfResult = {
        fileName: 'file.pdf',
        url: 'http://url.com',
      } as unknown as IPdfResult;
      mockResponsePdfsService.pdfResponseBucket.mockResolvedValue(
        mockPdfResult,
      );

      const mockReloadedTicket = {
        id: 'ticket-uuid',
        folio: '123',
        status: 'ARCHIVADO',
      } as unknown as Ticket;
      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockReloadedTicket,
      );

      const result = await service.archiveTicket('ticket-uuid', mockUser);

      expect(result).toEqual(mockReloadedTicket);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ticket.archived',
        mockReloadedTicket,
      );
      expect(mockTransactionManager.save).toHaveBeenCalledTimes(2);
      expect(mockResponsePdfsService.pdfResponseBucket).toHaveBeenCalledWith(
        mockTicketCompleted,
      );
    });

    it('debería lanzar ConflictException si el usuario no tiene el perfil de planeación', async () => {
      const mockUser = { id: 'user-uuid' } as unknown as User;

      mockUsersService.findOne.mockResolvedValue({
        staff: null,
        role: { name: ValidRole.tecnico },
      });

      const mockTicket = { id: 'ticket-uuid' } as Ticket;
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);

      await expect(
        service.archiveTicket('ticket-uuid', mockUser),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.archiveTicket('ticket-uuid', mockUser),
      ).rejects.toThrow('errors.tickets.no_planning_profile');
    });

    it('debería lanzar ServiceUnavailableException si falla la generación del PDF', async () => {
      const mockUser = { id: 'user-uuid' } as unknown as User;
      const mockJefePlaneacion = { rfc: 'RFC123' };

      mockUsersService.findOne.mockResolvedValue({
        staff: mockJefePlaneacion,
        role: { name: ValidRole.planning },
      });

      const mockTicket = { id: 'ticket-uuid' } as Ticket;
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'FINALIZADO' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });
      mockTransactionManager.save.mockResolvedValue(mockTicket);
      mockResponsesService.findByTicketIdOrFail.mockResolvedValue({});
      mockTicketsService.findAllDetailsByIdOrFail.mockResolvedValue(mockTicket);

      mockResponsePdfsService.pdfResponseBucket.mockRejectedValue(
        new Error('PDF Error'),
      );

      await expect(
        service.archiveTicket('ticket-uuid', mockUser),
      ).rejects.toThrow(ServiceUnavailableException);
      await expect(
        service.archiveTicket('ticket-uuid', mockUser),
      ).rejects.toThrow('errors.tickets.pdf_generation_failed');
    });

    it('debería lanzar ConflictException si ocurre un OptimisticLockVersionMismatchError', async () => {
      const mockUser = { id: 'user-uuid' } as unknown as User;

      mockUsersService.findOne.mockResolvedValue({
        staff: { rfc: 'RFC123' },
        role: { name: ValidRole.planning },
      });

      const mockTicket = { id: 'ticket-uuid' } as Ticket;
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'FINALIZADO' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      const lockError = new OptimisticLockVersionMismatchError('Ticket', 1, 2);

      mockTransactionManager.save.mockRejectedValueOnce(lockError);

      await expect(
        service.archiveTicket('ticket-uuid', mockUser),
      ).rejects.toThrow(
        new ConflictException('errors.tickets.version_mismatch'),
      );
    });
  });
});
