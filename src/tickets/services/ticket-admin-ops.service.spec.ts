import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { TicketAdminOpsService } from './ticket-admin-ops.service';
import { Ticket } from '../entities/ticket.entity';
import { TicketDetailsService } from './ticket-details.service';
import { PdfsService } from 'src/pdfs/services/pdfs.service';
import { DocumentType } from '../dto/regenerate-pdf.dto';
import { Response } from 'src/responses/entities/response.entity';

describe('TicketAdminOpsService', () => {
  let service: TicketAdminOpsService;
  let ticketRepository: jest.Mocked<Repository<Ticket>>;
  let ticketDetailsService: jest.Mocked<TicketDetailsService>;
  let responsePdfsService: jest.Mocked<PdfsService>;

  const mockRepository = {
    save: jest.fn(),
  };

  const mockTicketDetailsService = {
    findOneByIdOrFail: jest.fn(),
    findAllDetailsByIdOrFail: jest.fn(),
  };

  const mockResponsePdfsService = {
    pdfRequestBucket: jest.fn(),
    pdfResponseBucket: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketAdminOpsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockRepository,
        },
        {
          provide: TicketDetailsService,
          useValue: mockTicketDetailsService,
        },
        {
          provide: PdfsService,
          useValue: mockResponsePdfsService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<TicketAdminOpsService>(TicketAdminOpsService);
    ticketRepository = module.get(getRepositoryToken(Ticket));
    ticketDetailsService = module.get(TicketDetailsService);
    responsePdfsService = module.get(PdfsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(ticketRepository).toBeDefined();
    expect(ticketDetailsService).toBeDefined();
    expect(responsePdfsService).toBeDefined();
  });

  describe('updateInternalFolio', () => {
    it('should update folio successfully', async () => {
      const mockTicket = { id: 'uuid-1', internal_folio: 'OLD-1' } as Ticket;
      mockTicketDetailsService.findOneByIdOrFail.mockResolvedValue(mockTicket);
      mockRepository.save.mockResolvedValue({
        ...mockTicket,
        internal_folio: 'NEW-1',
      });

      const result = await service.updateInternalFolio('uuid-1', {
        internal_folio: 'NEW-1',
      });

      expect(result.internal_folio).toBe('NEW-1');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate key code 23505', async () => {
      mockTicketDetailsService.findOneByIdOrFail.mockResolvedValue({});
      mockRepository.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.updateInternalFolio('uuid-1', { internal_folio: 'DUP' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ServiceUnavailableException on generic database error', async () => {
      mockTicketDetailsService.findOneByIdOrFail.mockResolvedValue({});
      mockRepository.save.mockRejectedValue(new Error('DB failure'));

      await expect(
        service.updateInternalFolio('uuid-1', { internal_folio: 'FAIL' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('regeneratePdf', () => {
    it('should regenerate request PDF', async () => {
      const mockTicket = { id: 'uuid-1' } as unknown as Ticket;
      mockTicketDetailsService.findAllDetailsByIdOrFail.mockResolvedValue(
        mockTicket,
      );
      mockResponsePdfsService.pdfRequestBucket.mockResolvedValue({
        url: 'http://minio/request.pdf',
      });

      const result = await service.regeneratePdf('uuid-1', {
        type: DocumentType.REQUEST,
      });

      expect(result).toEqual({ url: 'http://minio/request.pdf' });
      expect(mockResponsePdfsService.pdfRequestBucket).toHaveBeenCalledWith(
        mockTicket,
      );
    });

    it('should throw ServiceUnavailableException when response is missing for RESPONSE type', async () => {
      const mockTicket = { id: 'uuid-1', response: null } as unknown as Ticket;
      mockTicketDetailsService.findAllDetailsByIdOrFail.mockResolvedValue(
        mockTicket,
      );

      await expect(
        service.regeneratePdf('uuid-1', { type: DocumentType.RESPONSE }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should regenerate response PDF when response is present', async () => {
      const mockTicket = {
        id: 'uuid-1',
        response: { id: 'resp-1' } as Response,
      } as unknown as Ticket;
      mockTicketDetailsService.findAllDetailsByIdOrFail.mockResolvedValue(
        mockTicket,
      );
      mockResponsePdfsService.pdfResponseBucket.mockResolvedValue({
        url: 'http://minio/response.pdf',
      });

      const result = await service.regeneratePdf('uuid-1', {
        type: DocumentType.RESPONSE,
      });

      expect(result).toEqual({ url: 'http://minio/response.pdf' });
      expect(mockResponsePdfsService.pdfResponseBucket).toHaveBeenCalledWith(
        mockTicket,
      );
    });
  });
});
