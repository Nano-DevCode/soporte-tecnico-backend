import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource, OptimisticLockVersionMismatchError } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from 'nestjs-i18n';
import { FinishTicketService } from './finish-ticket.service';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { TicketsService } from './tickets.service';
import { FolioCountersService } from 'src/folio-counters/folio-counters.service';
import { ResponsesService } from '../../responses/responses.service';
import { PdfsService } from 'src/pdfs/services/pdfs.service';
import { Ticket } from '../entities/ticket.entity';
import { Document } from 'src/documents/entities/document.entity';
import { FinishTicketDto } from '../dto/finish-ticket.dto';
import { AttendsService } from 'src/attends/attends.service';
import { TechnicalReportsService } from '../../technical-reports/technical-reports.service';
import { FaultValiditiesService } from 'src/fault-validities/fault-validities.service';

jest.mock('src/common/machine/TicketStateMachine.machine', () => {
  const original = jest.requireActual<
    typeof import('src/common/machine/TicketStateMachine.machine')
  >('src/common/machine/TicketStateMachine.machine');
  return {
    ...original,
    transition: jest.fn().mockReturnValue('FINALIZADO'),
  };
});

describe('FinishTicketService', () => {
  let service: FinishTicketService;

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

  const mockFolioCountersService = {
    generateNewFolio: jest.fn(),
  };

  const mockResponsesService = {
    create: jest.fn(),
  };

  const mockResponsePdfsService = {
    pdfResponseBucket: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  const mockTechnicalReportsService = {
    create: jest.fn(),
  };

  const mockFaultValiditiesService = {
    findAll: jest.fn().mockResolvedValue([]),
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
        FinishTicketService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: TicketHistoryService, useValue: mockTicketHistoryService },
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: FolioCountersService, useValue: mockFolioCountersService },
        { provide: ResponsesService, useValue: mockResponsesService },
        { provide: PdfsService, useValue: mockResponsePdfsService },
        { provide: I18nService, useValue: mockI18nService },
        { provide: AttendsService, useValue: { endAttention: jest.fn() } },
        {
          provide: TechnicalReportsService,
          useValue: mockTechnicalReportsService,
        },
        {
          provide: FaultValiditiesService,
          useValue: mockFaultValiditiesService,
        },
      ],
    }).compile();

    service = module.get<FinishTicketService>(FinishTicketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('finishTicket', () => {
    const mockTicketId = 'ticket-uuid';
    const mockFinishDto: FinishTicketDto = {
      diagnosis: 'Se identificó un fallo en la red',
      work_done: 'Se procedió a reiniciar el router y cambiar el cable',
      maintenance_type_id: '123e4567-e89b-12d3-a456-426614174000',
      service_type_id: '123e4567-e89b-12d3-a456-426614174001',
    };

    it('debería finalizar el ticket generando un folio interno si no tiene uno, crear documento y emitir evento', async () => {
      const mockTicket = {
        id: mockTicketId,
        version: 1,
        internal_folio: null,
        jefe_depto: { department: { acronym: 'DEP' } },
      } as unknown as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'EN_PROGRESO' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      mockFolioCountersService.generateNewFolio.mockResolvedValue('INT-001');

      mockTransactionManager.save.mockResolvedValue(mockTicket);

      const mockTicketCompleted = {
        id: mockTicketId,
        details: true,
      } as unknown as Ticket;
      mockTicketsService.findAllDetailsByIdOrFail.mockResolvedValue(
        mockTicketCompleted,
      );

      mockResponsePdfsService.pdfResponseBucket.mockResolvedValue({
        fileName: 'file.pdf',
        url: 'http://url.com',
      });

      const mockReloadedTicket = {
        id: mockTicketId,
        status: 'FINALIZADO',
      } as unknown as Ticket;
      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockReloadedTicket,
      );

      const result = await service.finishTicket(mockTicketId, mockFinishDto);

      expect(result).toEqual(mockReloadedTicket);

      expect(mockFolioCountersService.generateNewFolio).toHaveBeenCalledWith(
        mockTicket.jefe_depto.department.acronym,
        mockTransactionManager,
      );

      expect(mockTransactionManager.save).toHaveBeenCalledWith(
        Ticket,
        expect.objectContaining({
          internal_folio: 'INT-001',
        }),
      );

      expect(mockResponsesService.create).toHaveBeenCalledWith(
        { ...mockFinishDto, ticket_id: mockTicketId },
        mockTransactionManager,
      );

      expect(mockTransactionManager.create).toHaveBeenCalledWith(Document, {
        name: 'file.pdf',
        url: 'http://url.com',
        ticket: mockTicketCompleted,
        type_document: { id: 2 },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ticket.finished',
        mockReloadedTicket,
      );
    });

    it('debería finalizar el ticket usando el folio interno existente', async () => {
      const mockTicket = {
        id: mockTicketId,
        version: 1,
        internal_folio: 'EXISTING-001',
        jefe_depto: { department: { acronym: 'DEP' } },
      } as unknown as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'EN_PROGRESO' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      mockTransactionManager.save.mockResolvedValue(mockTicket);

      const mockTicketCompleted = { id: mockTicketId } as Ticket;
      mockTicketsService.findAllDetailsByIdOrFail.mockResolvedValue(
        mockTicketCompleted,
      );

      mockResponsePdfsService.pdfResponseBucket.mockResolvedValue({
        fileName: 'file.pdf',
        url: 'http://url.com',
      });

      const mockReloadedTicket = {
        id: mockTicketId,
        status: 'FINALIZADO',
      } as unknown as Ticket;
      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockReloadedTicket,
      );

      await service.finishTicket(mockTicketId, mockFinishDto);

      expect(mockFolioCountersService.generateNewFolio).not.toHaveBeenCalled();

      expect(mockTransactionManager.save).toHaveBeenCalledWith(
        Ticket,
        expect.objectContaining({
          internal_folio: 'EXISTING-001',
        }),
      );
    });

    it('debería lanzar ServiceUnavailableException si falla la generación del PDF', async () => {
      const mockTicket = {
        id: mockTicketId,
        version: 1,
        internal_folio: 'INT-001',
      } as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'EN_PROGRESO' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      mockTransactionManager.save.mockResolvedValue(mockTicket);

      const mockTicketCompleted = { id: mockTicketId } as Ticket;
      mockTicketsService.findAllDetailsByIdOrFail.mockResolvedValue(
        mockTicketCompleted,
      );

      mockResponsePdfsService.pdfResponseBucket.mockRejectedValue(
        new Error('PDF error'),
      );

      await expect(
        service.finishTicket(mockTicketId, mockFinishDto),
      ).rejects.toThrow(
        new ServiceUnavailableException('errors.tickets.pdf_generation_failed'),
      );
    });

    it('debería lanzar ConflictException si ocurre un OptimisticLockVersionMismatchError', async () => {
      const mockTicket = {
        id: mockTicketId,
        version: 1,
        internal_folio: 'INT-001',
      } as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'EN_PROGRESO' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      const lockError = new OptimisticLockVersionMismatchError('Ticket', 1, 2);
      mockDataSource.transaction.mockRejectedValue(lockError);

      await expect(
        service.finishTicket(mockTicketId, mockFinishDto),
      ).rejects.toThrow(
        new ConflictException('errors.tickets.version_mismatch'),
      );
    });
  });
});
