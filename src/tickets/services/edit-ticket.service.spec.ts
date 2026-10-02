import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource, OptimisticLockVersionMismatchError } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from 'nestjs-i18n';
import { EditTicketService } from './edit-ticket.service';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { TicketsService } from './tickets.service';
import { PdfsService } from 'src/pdfs/services/pdfs.service';
import { Ticket } from '../entities/ticket.entity';
import { Document } from 'src/documents/entities/document.entity';
import { UpdateTicketDto } from '../dto/update-ticket.dto';

jest.mock('src/common/machine/TicketStateMachine.machine', () => {
  const original = jest.requireActual<
    typeof import('src/common/machine/TicketStateMachine.machine')
  >('src/common/machine/TicketStateMachine.machine');
  return {
    ...original,
    transition: jest.fn().mockReturnValue('CORREGIDA'),
  };
});

describe('EditTicketService', () => {
  let service: EditTicketService;

  const mockTransactionManager = {
    save: jest.fn(),
    create: jest
      .fn()
      .mockImplementation(<T>(entity: unknown, dto: T): T => dto),
    findOne: jest.fn(),
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
    findOneByIdWithDetailsOrFail: jest.fn(),
  };

  const mockResponsePdfsService = {
    pdfRequestBucket: jest.fn(),
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
        EditTicketService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: TicketHistoryService, useValue: mockTicketHistoryService },
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: PdfsService, useValue: mockResponsePdfsService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<EditTicketService>(EditTicketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('editTicket', () => {
    const mockTicketId = 'ticket-uuid';
    const mockUpdateDto: UpdateTicketDto = {
      description: 'New description',
      issue_type: 2,
    };

    it('debería editar el ticket, crear un nuevo documento y emitir el evento', async () => {
      const mockTicket = { id: mockTicketId, version: 1 } as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'NUEVA' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      const mockReloadedTicket = {
        id: mockTicketId,
        status: 'CORREGIDA',
      } as unknown as Ticket;
      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockReloadedTicket,
      );

      mockResponsePdfsService.pdfRequestBucket.mockResolvedValue({
        fileName: 'file.pdf',
        url: 'http://url.com',
      });

      mockTransactionManager.findOne.mockResolvedValue(null);

      const result = await service.editTicket(mockTicketId, mockUpdateDto);

      expect(result).toEqual(mockReloadedTicket);

      expect(mockTransactionManager.save).toHaveBeenCalledWith(
        Ticket,
        expect.objectContaining({
          id: mockTicket.id,
          version: mockTicket.version,
          description: 'New description',
          issue_type: { id: 2 },
        }),
      );

      expect(mockTransactionManager.create).toHaveBeenCalledWith(Document, {
        name: 'file.pdf',
        url: 'http://url.com',
        ticket: mockReloadedTicket,
        type_document: { id: 1 },
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ticket.edited',
        mockReloadedTicket,
      );
    });

    it('debería editar el ticket y actualizar el documento existente', async () => {
      const mockTicket = { id: mockTicketId, version: 1 } as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'NUEVA' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      const mockReloadedTicket = { id: mockTicketId } as unknown as Ticket;
      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockReloadedTicket,
      );

      mockResponsePdfsService.pdfRequestBucket.mockResolvedValue({
        fileName: 'new-file.pdf',
        url: 'http://new-url.com',
      });

      const existingDocument = {
        id: 'doc-1',
        name: 'old-file.pdf',
        url: 'http://old-url.com',
      } as Document;

      mockTransactionManager.findOne.mockResolvedValue(existingDocument);

      await service.editTicket(mockTicketId, {
        description: 'New description',
      });

      expect(existingDocument.name).toBe('new-file.pdf');
      expect(existingDocument.url).toBe('http://new-url.com');
      expect(mockTransactionManager.save).toHaveBeenCalledWith(
        Document,
        existingDocument,
      );
    });

    it('debería lanzar ServiceUnavailableException si falla la generación del PDF', async () => {
      const mockTicket = { id: mockTicketId, version: 1 } as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'NUEVA' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockTicket,
      );

      mockResponsePdfsService.pdfRequestBucket.mockRejectedValue(
        new Error('PDF error'),
      );

      await expect(
        service.editTicket(mockTicketId, mockUpdateDto),
      ).rejects.toThrow(
        new ServiceUnavailableException('errors.tickets.pdf_generation_failed'),
      );
    });

    it('debería lanzar ConflictException si ocurre un OptimisticLockVersionMismatchError', async () => {
      const mockTicket = { id: mockTicketId, version: 1 } as Ticket;

      mockTicketsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockTicketsService.getCurrentHistory.mockReturnValue({
        status: { code: 'NUEVA' },
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });

      const lockError = new OptimisticLockVersionMismatchError('Ticket', 1, 2);
      mockDataSource.transaction.mockRejectedValue(lockError);

      await expect(
        service.editTicket(mockTicketId, mockUpdateDto),
      ).rejects.toThrow(
        new ConflictException('errors.tickets.version_mismatch'),
      );
    });
  });
});
