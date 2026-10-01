import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, OptimisticLockVersionMismatchError } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CloseTicketService } from './close-ticket.service';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { TicketsService } from './tickets.service';
import { ResponseSignatureService } from '../../response-signature/response-signature.service';
import { UsersService } from '../../users/services/users.service';
import { ResponsesService } from '../../responses/responses.service';
import { PdfsService } from 'src/pdfs/services/pdfs.service';
import { SurveyService } from '../../survey/survey.service';
import { User } from 'src/users/entities/user.entity';
import { Ticket } from '../entities/ticket.entity';
import { CloseTicketDto } from '../dto/close-ticket.dto';

jest.mock('src/common/machine/TicketStateMachine.machine', () => {
  const original = jest.requireActual<
    typeof import('src/common/machine/TicketStateMachine.machine')
  >('src/common/machine/TicketStateMachine.machine');
  return {
    ...original,
    transition: jest.fn().mockReturnValue('CERRADO'),
  };
});

describe('CloseTicketService', () => {
  let service: CloseTicketService;

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

  const mockSurveyService = {
    submitSurvey: jest.fn(),
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
        CloseTicketService,
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
        { provide: PdfsService, useValue: mockResponsePdfsService },
        { provide: SurveyService, useValue: mockSurveyService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<CloseTicketService>(CloseTicketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('closeTicket', () => {
    const mockUser = { id: 'user-uuid' } as unknown as User;
    const mockDto = {} as CloseTicketDto;

    it('debería cerrar el ticket exitosamente y emitir el evento', async () => {
      mockUsersService.findOne.mockResolvedValue({
        staff: { id: 'jefe-1', rfc: 'RFC123' },
      });

      const mockTicket = {
        id: 'ticket-uuid',
        jefe_depto: { id: 'jefe-1' },
      } as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'RESUELTO' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      mockTransactionManager.save.mockResolvedValue(mockTicket);
      mockResponsesService.findByTicketIdOrFail.mockResolvedValue({
        id: 'resp-1',
      });
      mockTicketsService.findAllDetailsByIdOrFail.mockResolvedValue(mockTicket);
      mockResponsePdfsService.pdfResponseBucket.mockResolvedValue({
        fileName: 'file.pdf',
        url: 'http://url.com',
      });

      const mockReloadedTicket = {
        id: 'ticket-uuid',
        status: 'CERRADO',
      } as unknown as Ticket;

      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockReloadedTicket,
      );

      const result = await service.closeTicket(
        'ticket-uuid',
        mockUser,
        mockDto,
      );

      expect(result).toEqual(mockReloadedTicket);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ticket.closed',
        mockReloadedTicket,
      );
    });

    it('debería lanzar ConflictException si el usuario no tiene perfil de jefe de departamento', async () => {
      mockUsersService.findOne.mockResolvedValue({ staff: null });

      const mockTicket = { id: 'ticket-uuid' } as Ticket;
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);

      await expect(
        service.closeTicket('ticket-uuid', mockUser, mockDto),
      ).rejects.toThrow(
        new ConflictException('errors.tickets.no_department_boss_profile'),
      );
    });

    it('debería lanzar ConflictException si el ticket no tiene un jefe de departamento asignado', async () => {
      mockUsersService.findOne.mockResolvedValue({
        staff: { id: 'jefe-1', rfc: 'RFC123' },
      });

      const mockTicket = {
        id: 'ticket-uuid',
        jefe_depto: null,
      } as unknown as Ticket;
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);

      await expect(
        service.closeTicket('ticket-uuid', mockUser, mockDto),
      ).rejects.toThrow(
        new ConflictException('errors.tickets.ticket_no_boss_assigned'),
      );
    });

    it('debería lanzar ConflictException si el usuario no es el creador del ticket', async () => {
      mockUsersService.findOne.mockResolvedValue({
        staff: { id: 'jefe-1', rfc: 'RFC123' },
      });

      const mockTicket = {
        id: 'ticket-uuid',
        jefe_depto: { id: 'jefe-2' },
      } as Ticket;
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);

      await expect(
        service.closeTicket('ticket-uuid', mockUser, mockDto),
      ).rejects.toThrow(
        new ConflictException('errors.tickets.only_creator_can_close'),
      );
    });

    it('debería lanzar ConflictException si el jefe de departamento no tiene RFC', async () => {
      mockUsersService.findOne.mockResolvedValue({
        staff: { id: 'jefe-1', rfc: '' },
      });

      const mockTicket = {
        id: 'ticket-uuid',
        jefe_depto: { id: 'jefe-1' },
      } as Ticket;
      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);

      await expect(
        service.closeTicket('ticket-uuid', mockUser, mockDto),
      ).rejects.toThrow(new ConflictException('errors.tickets.missing_rfc'));
    });

    it('debería lanzar ServiceUnavailableException si falla la generación del PDF', async () => {
      mockUsersService.findOne.mockResolvedValue({
        staff: { id: 'jefe-1', rfc: 'RFC123' },
      });

      const mockTicket = {
        id: 'ticket-uuid',
        jefe_depto: { id: 'jefe-1' },
      } as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'RESUELTO' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      mockTransactionManager.save.mockResolvedValue(mockTicket);
      mockResponsesService.findByTicketIdOrFail.mockResolvedValue({
        id: 'resp-1',
      });
      mockTicketsService.findAllDetailsByIdOrFail.mockResolvedValue(mockTicket);

      mockResponsePdfsService.pdfResponseBucket.mockRejectedValue(
        new Error('PDF Error'),
      );

      await expect(
        service.closeTicket('ticket-uuid', mockUser, mockDto),
      ).rejects.toThrow(
        new ServiceUnavailableException('errors.tickets.pdf_generation_failed'),
      );
    });

    it('debería lanzar ConflictException si ocurre un OptimisticLockVersionMismatchError', async () => {
      mockUsersService.findOne.mockResolvedValue({
        staff: { id: 'jefe-1', rfc: 'RFC123' },
      });

      const mockTicket = {
        id: 'ticket-uuid',
        jefe_depto: { id: 'jefe-1' },
      } as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'RESUELTO' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      const lockError = new OptimisticLockVersionMismatchError('Ticket', 1, 2);
      mockDataSource.transaction.mockRejectedValue(lockError);

      await expect(
        service.closeTicket('ticket-uuid', mockUser, mockDto),
      ).rejects.toThrow(
        new ConflictException('errors.tickets.version_mismatch'),
      );
    });
  });
});
