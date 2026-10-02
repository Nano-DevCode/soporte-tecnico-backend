import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { TicketQueriesService } from './ticket-queries.service';
import { TicketDetailsService } from './ticket-details.service';
import { TicketReportsService } from './ticket-reports.service';
import { TicketAdminOpsService } from './ticket-admin-ops.service';
import { Ticket } from '../entities/ticket.entity';
import { User } from 'src/users/entities/user.entity';
import { FilterTicketsDto } from '../dto/filter-tickets.dto';
import { FilterTicketsForSelectDto } from '../dto/filter-tickets-for-select';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { FilterTicketReportsDto } from '../dto/filter-ticket-reports.dto';
import { RegeneratePdfDto, DocumentType } from '../dto/regenerate-pdf.dto';
import { Status } from 'src/ticket-history/entities';
import { TicketHistory } from 'src/ticket-history/entities/ticket-history.entity';

describe('TicketsService (Facade)', () => {
  let service: TicketsService;
  let ticketQueriesService: jest.Mocked<TicketQueriesService>;
  let ticketDetailsService: jest.Mocked<TicketDetailsService>;
  let ticketReportsService: jest.Mocked<TicketReportsService>;
  let ticketAdminOpsService: jest.Mocked<TicketAdminOpsService>;

  const mockQueriesService = {
    allowedSortColumns: { created_at: 'ticket.created_at' },
    findAllForUser: jest.fn(),
    findCurrentForUser: jest.fn(),
    findAllClosedAndArchived: jest.fn(),
    findAllByStatusForSelect: jest.fn(),
    findAllPaginated: jest.fn(),
  };

  const mockDetailsService = {
    findOne: jest.fn(),
    findOneByIdWithDetailsOrFail: jest.fn(),
    findAuthorizedDetails: jest.fn(),
    findAllDetailsByIdOrFail: jest.fn(),
    findOneByIdOrFail: jest.fn(),
    getCurrentStatus: jest.fn(),
    getCurrentHistory: jest.fn(),
  };

  const mockReportsService = {
    getTicketsSummaryReport: jest.fn(),
  };

  const mockAdminOpsService = {
    updateInternalFolio: jest.fn(),
    regeneratePdf: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: TicketQueriesService, useValue: mockQueriesService },
        { provide: TicketDetailsService, useValue: mockDetailsService },
        { provide: TicketReportsService, useValue: mockReportsService },
        { provide: TicketAdminOpsService, useValue: mockAdminOpsService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketQueriesService = module.get(TicketQueriesService);
    ticketDetailsService = module.get(TicketDetailsService);
    ticketReportsService = module.get(TicketReportsService);
    ticketAdminOpsService = module.get(TicketAdminOpsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(ticketQueriesService).toBeDefined();
    expect(ticketDetailsService).toBeDefined();
    expect(ticketReportsService).toBeDefined();
    expect(ticketAdminOpsService).toBeDefined();
  });

  it('should delegate allowedSortColumns', () => {
    expect(service.allowedSortColumns).toEqual({
      created_at: 'ticket.created_at',
    });
  });

  it('should delegate findAllForUser', async () => {
    const dto = {} as FilterTicketsDto;
    const user = {} as User;
    mockQueriesService.findAllForUser.mockResolvedValue('result');

    const result = await service.findAllForUser(dto, user);
    expect(mockQueriesService.findAllForUser).toHaveBeenCalledWith(dto, user);
    expect(result).toBe('result');
  });

  it('should delegate findCurrentForUser', async () => {
    const dto = {} as FilterTicketsDto;
    const user = {} as User;
    mockQueriesService.findCurrentForUser.mockResolvedValue('result');

    const result = await service.findCurrentForUser(dto, user);
    expect(mockQueriesService.findCurrentForUser).toHaveBeenCalledWith(
      dto,
      user,
    );
    expect(result).toBe('result');
  });

  it('should delegate findAllClosedAndArchived', async () => {
    const dto = {} as FilterTicketsDto;
    mockQueriesService.findAllClosedAndArchived.mockResolvedValue('result');

    const result = await service.findAllClosedAndArchived(dto);
    expect(mockQueriesService.findAllClosedAndArchived).toHaveBeenCalledWith(
      dto,
    );
    expect(result).toBe('result');
  });

  it('should delegate findAllByStatusForSelect', async () => {
    const dto = {} as FilterTicketsForSelectDto;
    mockQueriesService.findAllByStatusForSelect.mockResolvedValue('result');

    const result = await service.findAllByStatusForSelect(dto);
    expect(mockQueriesService.findAllByStatusForSelect).toHaveBeenCalledWith(
      dto,
    );
    expect(result).toBe('result');
  });

  it('should delegate findAllPaginated', async () => {
    const dto = {} as PaginationWithPageDto;
    mockQueriesService.findAllPaginated.mockResolvedValue('result');

    const result = await service.findAllPaginated(dto);
    expect(mockQueriesService.findAllPaginated).toHaveBeenCalledWith(dto);
    expect(result).toBe('result');
  });

  it('should delegate findOne', async () => {
    mockDetailsService.findOne.mockResolvedValue('ticket');
    const result = await service.findOne('id-1');
    expect(mockDetailsService.findOne).toHaveBeenCalledWith('id-1');
    expect(result).toBe('ticket');
  });

  it('should delegate findOneByIdWithDetailsOrFail', async () => {
    mockDetailsService.findOneByIdWithDetailsOrFail.mockResolvedValue('ticket');
    const result = await service.findOneByIdWithDetailsOrFail('id-1');
    expect(
      mockDetailsService.findOneByIdByIdWithDetailsOrFail ||
        mockDetailsService.findOneByIdWithDetailsOrFail,
    ).toHaveBeenCalledWith('id-1', undefined);
    expect(result).toBe('ticket');
  });

  it('should delegate findAuthorizedDetails', async () => {
    const user = {} as User;
    mockDetailsService.findAuthorizedDetails.mockResolvedValue('ticket');
    const result = await service.findAuthorizedDetails('id-1', user);
    expect(mockDetailsService.findAuthorizedDetails).toHaveBeenCalledWith(
      'id-1',
      user,
      undefined,
    );
    expect(result).toBe('ticket');
  });

  it('should delegate findAllDetailsByIdOrFail', async () => {
    mockDetailsService.findAllDetailsByIdOrFail.mockResolvedValue('ticket');
    const result = await service.findAllDetailsByIdOrFail('id-1');
    expect(mockDetailsService.findAllDetailsByIdOrFail).toHaveBeenCalledWith(
      'id-1',
      undefined,
    );
    expect(result).toBe('ticket');
  });

  it('should delegate findOneByIdOrFail', async () => {
    mockDetailsService.findOneByIdOrFail.mockResolvedValue('ticket');
    const result = await service.findOneByIdOrFail('id-1');
    expect(mockDetailsService.findOneByIdOrFail).toHaveBeenCalledWith(
      'id-1',
      undefined,
    );
    expect(result).toBe('ticket');
  });

  it('should delegate getCurrentStatus and getCurrentHistory', () => {
    const ticket = {} as Ticket;
    const mockStatus = { id: 's1' } as Status;
    const mockHistory = { id: 'h1' } as TicketHistory;
    mockDetailsService.getCurrentStatus.mockReturnValue(mockStatus);
    mockDetailsService.getCurrentHistory.mockReturnValue(mockHistory);

    expect(service.getCurrentStatus(ticket)).toBe(mockStatus);
    expect(service.getCurrentHistory(ticket)).toBe(mockHistory);
  });

  it('should delegate getTicketsSummaryReport', async () => {
    const dto = {} as FilterTicketReportsDto;
    mockReportsService.getTicketsSummaryReport.mockResolvedValue('report');

    const result = await service.getTicketsSummaryReport(dto);
    expect(mockReportsService.getTicketsSummaryReport).toHaveBeenCalledWith(
      dto,
    );
    expect(result).toBe('report');
  });

  it('should delegate updateInternalFolio', async () => {
    const dto = { internal_folio: 'INT-01' };
    mockAdminOpsService.updateInternalFolio.mockResolvedValue('updated');

    const result = await service.updateInternalFolio('id-1', dto);
    expect(mockAdminOpsService.updateInternalFolio).toHaveBeenCalledWith(
      'id-1',
      dto,
    );
    expect(result).toBe('updated');
  });

  it('should delegate regeneratePdf', async () => {
    const dto = { type: DocumentType.REQUEST } as RegeneratePdfDto;
    mockAdminOpsService.regeneratePdf.mockResolvedValue({
      url: 'pdf',
    });

    const result = await service.regeneratePdf('id-1', dto);
    expect(mockAdminOpsService.regeneratePdf).toHaveBeenCalledWith('id-1', dto);
    expect(result).toEqual({ url: 'pdf' });
  });
});
