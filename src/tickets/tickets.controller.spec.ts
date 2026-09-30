import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { TicketsController } from './tickets.controller';
import {
  AssignTicketService,
  CreateTicketService,
  EditTicketService,
  FinishTicketService,
  InterveneTicketService,
  PauseTicketService,
  RouteTicketService,
  StartTicketService,
  TicketsService,
} from './services';
import { RejectTicketService } from './services/reject-ticket.service';
import { CloseTicketService } from './services/close-ticket.service';
import { ArchiveTicketService } from './services/archive-ticket.service';
import { RejectionReportsService } from 'src/rejection-reports/rejection-reports.service';
import { TechnicalReportsService } from 'src/technical-reports/technical-reports.service';
import { ResponsesService } from '../responses/responses.service';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';
import { User } from 'src/users/entities/user.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketOnBehalfDto } from './dto/create-ticket-on-behalf';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { FilterTicketsForSelectDto } from './dto/filter-tickets-for-select';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { RouteTicketDto } from './dto/route-ticket.dto';
import { AssignTechnicsDto } from './dto/assign-technics.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { RejectTicketDto } from './dto/reject-ticket.dto';
import { InterveneTicketDto } from './dto/intervene-ticket.dto';
import { FinishTicketDto } from './dto/finish-ticket.dto';
import { CloseTicketDto } from './dto/close-ticket.dto';
import { UpdateResponseDto } from 'src/responses/dto/update-response.dto';

describe('TicketsController', () => {
  let controller: TicketsController;
  let createTicketService: CreateTicketService;
  let ticketsService: TicketsService;
  let routeTicketService: RouteTicketService;
  let assignTicketService: AssignTicketService;
  let startTicketService: StartTicketService;
  let editTicketService: EditTicketService;
  let rejectTicketService: RejectTicketService;
  let intervenTicketService: InterveneTicketService;
  let finishTicketService: FinishTicketService;
  let closedTicketService: CloseTicketService;
  let archiveTicketService: ArchiveTicketService;
  let rejectionReportsService: RejectionReportsService;
  let technicalReportsService: TechnicalReportsService;
  let responsesService: ResponsesService;

  const mockUser = { id: 'user-uuid' } as unknown as User;

  const mockTicketsService = {
    findAllForUser: jest.fn(),
    findCurrentForUser: jest.fn(),
    findAllClosedAndArchived: jest.fn(),
    findAllPaginated: jest.fn(),
    findAllByStatusForSelect: jest.fn(),
    findAuthorizedDetails: jest.fn(),
  };
  const mockCreateTicketService = {
    create: jest.fn(),
    createOnBehalf: jest.fn(),
  };
  const mockAssignTicketService = { assignTechnicians: jest.fn() };
  const mockRouteTicketService = { routeTicket: jest.fn() };
  const mockStartTicketService = { startTicket: jest.fn() };
  const mockEditTicketService = { editTicket: jest.fn() };
  const mockRejectTicketService = { rejectTicket: jest.fn() };
  const mockInterveneTicketService = { interveneTicket: jest.fn() };
  const mockPauseTicketService = {};
  const mockFinishTicketService = { finishTicket: jest.fn() };
  const mockCloseTicketService = { closeTicket: jest.fn() };
  const mockArchiveTicketService = { archiveTicket: jest.fn() };
  const mockRejectionReportsService = { findOneByTicketIdOrFail: jest.fn() };
  const mockTechnicalReportsService = { findAllByTicketId: jest.fn() };
  const mockResponsesService = {
    findDetailsByTicketIdOrFail: jest.fn(),
    update: jest.fn(),
  };
  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };
  const mockIdempotencyInterceptor = {
    intercept: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: CreateTicketService, useValue: mockCreateTicketService },
        { provide: AssignTicketService, useValue: mockAssignTicketService },
        { provide: RouteTicketService, useValue: mockRouteTicketService },
        { provide: StartTicketService, useValue: mockStartTicketService },
        { provide: EditTicketService, useValue: mockEditTicketService },
        { provide: RejectTicketService, useValue: mockRejectTicketService },
        {
          provide: InterveneTicketService,
          useValue: mockInterveneTicketService,
        },
        { provide: PauseTicketService, useValue: mockPauseTicketService },
        { provide: FinishTicketService, useValue: mockFinishTicketService },
        { provide: CloseTicketService, useValue: mockCloseTicketService },
        { provide: ArchiveTicketService, useValue: mockArchiveTicketService },
        {
          provide: RejectionReportsService,
          useValue: mockRejectionReportsService,
        },
        {
          provide: TechnicalReportsService,
          useValue: mockTechnicalReportsService,
        },
        { provide: ResponsesService, useValue: mockResponsesService },
        { provide: I18nService, useValue: mockI18nService },
        {
          provide: IdempotencyInterceptor,
          useValue: mockIdempotencyInterceptor,
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    createTicketService = module.get<CreateTicketService>(CreateTicketService);
    ticketsService = module.get<TicketsService>(TicketsService);
    routeTicketService = module.get<RouteTicketService>(RouteTicketService);
    assignTicketService = module.get<AssignTicketService>(AssignTicketService);
    startTicketService = module.get<StartTicketService>(StartTicketService);
    editTicketService = module.get<EditTicketService>(EditTicketService);
    rejectTicketService = module.get<RejectTicketService>(RejectTicketService);
    intervenTicketService = module.get<InterveneTicketService>(
      InterveneTicketService,
    );
    finishTicketService = module.get<FinishTicketService>(FinishTicketService);
    closedTicketService = module.get<CloseTicketService>(CloseTicketService);
    archiveTicketService =
      module.get<ArchiveTicketService>(ArchiveTicketService);
    rejectionReportsService = module.get<RejectionReportsService>(
      RejectionReportsService,
    );
    technicalReportsService = module.get<TechnicalReportsService>(
      TechnicalReportsService,
    );
    responsesService = module.get<ResponsesService>(ResponsesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería llamar a CreateTicketService.create', async () => {
      const dto = {} as unknown as CreateTicketDto;
      const expected = { id: '1' };
      mockCreateTicketService.create.mockResolvedValue(expected);

      const result = await controller.create(dto, mockUser);
      expect(result).toEqual(expected);
      expect(createTicketService.create).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('createOnBehalf', () => {
    it('debería llamar a CreateTicketService.createOnBehalf', async () => {
      const dto = {} as unknown as CreateTicketOnBehalfDto;
      const expected = { id: '1' };
      mockCreateTicketService.createOnBehalf.mockResolvedValue(expected);

      const result = await controller.createOnBehalf(dto);
      expect(result).toEqual(expected);
      expect(createTicketService.createOnBehalf).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAllForUser', () => {
    it('debería llamar a TicketsService.findAllForUser', async () => {
      const dto = {} as unknown as FilterTicketsDto;
      const expected = { data: [] };
      mockTicketsService.findAllForUser.mockResolvedValue(expected);

      const result = await controller.findAllForUser(dto, mockUser);
      expect(result).toEqual(expected);
      expect(ticketsService.findAllForUser).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('findCurrentForUser', () => {
    it('debería llamar a TicketsService.findCurrentForUser', async () => {
      const dto = {} as unknown as FilterTicketsDto;
      const expected = { data: [] };
      mockTicketsService.findCurrentForUser.mockResolvedValue(expected);

      const result = await controller.findCurrentForUser(dto, mockUser);
      expect(result).toEqual(expected);
      expect(ticketsService.findCurrentForUser).toHaveBeenCalledWith(
        dto,
        mockUser,
      );
    });
  });

  describe('findAllClosedAndArchived', () => {
    it('debería llamar a TicketsService.findAllClosedAndArchived', async () => {
      const dto = {} as unknown as FilterTicketsDto;
      const expected = { data: [] };
      mockTicketsService.findAllClosedAndArchived.mockResolvedValue(expected);

      const result = await controller.findAllClosedAndArchived(dto);
      expect(result).toEqual(expected);
      expect(ticketsService.findAllClosedAndArchived).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAllPaginated', () => {
    it('debería llamar a TicketsService.findAllPaginated', async () => {
      const dto = {} as unknown as PaginationWithPageDto;
      const expected = { data: [] };
      mockTicketsService.findAllPaginated.mockResolvedValue(expected);

      const result = await controller.findAllPaginated(dto);
      expect(result).toEqual(expected);
      expect(ticketsService.findAllPaginated).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAllByStatusForSelect', () => {
    it('debería llamar a TicketsService.findAllByStatusForSelect', async () => {
      const dto = {} as unknown as FilterTicketsForSelectDto;
      const expected = [];
      mockTicketsService.findAllByStatusForSelect.mockResolvedValue(expected);

      const result = await controller.findAllByStatusForSelect(dto);
      expect(result).toEqual(expected);
      expect(ticketsService.findAllByStatusForSelect).toHaveBeenCalledWith(dto);
    });
  });

  describe('findOne', () => {
    it('debería llamar a TicketsService.findAuthorizedDetails', async () => {
      const expected = { id: 'uuid-1' };
      mockTicketsService.findAuthorizedDetails.mockResolvedValue(expected);

      const result = await controller.findOne('uuid-1', mockUser);
      expect(result).toEqual(expected);
      expect(ticketsService.findAuthorizedDetails).toHaveBeenCalledWith(
        'uuid-1',
        mockUser,
      );
    });
  });

  describe('routeTicket', () => {
    it('debería llamar a RouteTicketService.routeTicket', async () => {
      const dto = {} as unknown as RouteTicketDto;
      const expected = { id: 'uuid-1' };
      mockRouteTicketService.routeTicket.mockResolvedValue(expected);

      const result = await controller.routeTicket('uuid-1', dto);
      expect(result).toEqual(expected);
      expect(routeTicketService.routeTicket).toHaveBeenCalledWith(
        'uuid-1',
        dto,
      );
    });
  });

  describe('assignTechnics', () => {
    it('debería llamar a AssignTicketService.assignTechnicians', async () => {
      const dto = {} as unknown as AssignTechnicsDto;
      const expected = { id: 'uuid-1' };
      mockAssignTicketService.assignTechnicians.mockResolvedValue(expected);

      const result = await controller.assignTechnics('uuid-1', dto);
      expect(result).toEqual(expected);
      expect(assignTicketService.assignTechnicians).toHaveBeenCalledWith(
        'uuid-1',
        dto,
      );
    });
  });

  describe('startTicket', () => {
    it('debería llamar a StartTicketService.startTicket', async () => {
      const expected = { id: 'uuid-1' };
      mockStartTicketService.startTicket.mockResolvedValue(expected);

      const result = await controller.startTicket('uuid-1');
      expect(result).toEqual(expected);
      expect(startTicketService.startTicket).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('editTicket', () => {
    it('debería llamar a EditTicketService.editTicket', async () => {
      const dto = {} as unknown as UpdateTicketDto;
      const expected = { id: 'uuid-1' };
      mockEditTicketService.editTicket.mockResolvedValue(expected);

      const result = await controller.editTicket('uuid-1', dto);
      expect(result).toEqual(expected);
      expect(editTicketService.editTicket).toHaveBeenCalledWith('uuid-1', dto);
    });
  });

  describe('rejectTicket', () => {
    it('debería llamar a RejectTicketService.rejectTicket', async () => {
      const dto = {} as unknown as RejectTicketDto;
      const expected = { id: 'uuid-1' };
      mockRejectTicketService.rejectTicket.mockResolvedValue(expected);

      const result = await controller.rejectTicket('uuid-1', dto);
      expect(result).toEqual(expected);
      expect(rejectTicketService.rejectTicket).toHaveBeenCalledWith(
        'uuid-1',
        dto,
      );
    });
  });

  describe('registerIntervention', () => {
    it('debería llamar a InterveneTicketService.interveneTicket', async () => {
      const dto = {} as unknown as InterveneTicketDto;
      const expected = { id: 'uuid-1' };
      mockInterveneTicketService.interveneTicket.mockResolvedValue(expected);

      const result = await controller.registerIntervention('uuid-1', dto);
      expect(result).toEqual(expected);
      expect(intervenTicketService.interveneTicket).toHaveBeenCalledWith(
        'uuid-1',
        dto,
      );
    });
  });

  describe('finishTicket', () => {
    it('debería llamar a FinishTicketService.finishTicket', async () => {
      const dto = {} as unknown as FinishTicketDto;
      const expected = { id: 'uuid-1' };
      mockFinishTicketService.finishTicket.mockResolvedValue(expected);

      const result = await controller.finishTicket('uuid-1', dto);
      expect(result).toEqual(expected);
      expect(finishTicketService.finishTicket).toHaveBeenCalledWith(
        'uuid-1',
        dto,
      );
    });
  });

  describe('closeTicket', () => {
    it('debería llamar a CloseTicketService.closeTicket', async () => {
      const dto = {} as unknown as CloseTicketDto;
      const expected = { id: 'uuid-1' };
      mockCloseTicketService.closeTicket.mockResolvedValue(expected);

      const result = await controller.closeTicket('uuid-1', mockUser, dto);
      expect(result).toEqual(expected);
      expect(closedTicketService.closeTicket).toHaveBeenCalledWith(
        'uuid-1',
        mockUser,
        dto,
      );
    });
  });

  describe('archiveTicket', () => {
    it('debería llamar a ArchiveTicketService.archiveTicket', async () => {
      const expected = { id: 'uuid-1' };
      mockArchiveTicketService.archiveTicket.mockResolvedValue(expected);

      const result = await controller.archiveTicket('uuid-1', mockUser);
      expect(result).toEqual(expected);
      expect(archiveTicketService.archiveTicket).toHaveBeenCalledWith(
        'uuid-1',
        mockUser,
      );
    });
  });

  describe('getRejectionReport', () => {
    it('debería llamar a RejectionReportsService.findOneByTicketIdOrFail', async () => {
      const expected = { id: 'uuid-1' };
      mockRejectionReportsService.findOneByTicketIdOrFail.mockResolvedValue(
        expected,
      );

      const result = await controller.getRejectionReport('uuid-1');
      expect(result).toEqual(expected);
      expect(
        rejectionReportsService.findOneByTicketIdOrFail,
      ).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('getTechnicalReport', () => {
    it('debería llamar a TechnicalReportsService.findAllByTicketId', async () => {
      const expected = [];
      mockTechnicalReportsService.findAllByTicketId.mockResolvedValue(expected);

      const result = await controller.getTechnicalReport('uuid-1');
      expect(result).toEqual(expected);
      expect(technicalReportsService.findAllByTicketId).toHaveBeenCalledWith(
        'uuid-1',
      );
    });
  });

  describe('getResponse', () => {
    it('debería llamar a ResponsesService.findDetailsByTicketIdOrFail', async () => {
      const expected = { id: 'uuid-1' };
      mockResponsesService.findDetailsByTicketIdOrFail.mockResolvedValue(
        expected,
      );

      const result = await controller.getResponse('uuid-1');
      expect(result).toEqual(expected);
      expect(responsesService.findDetailsByTicketIdOrFail).toHaveBeenCalledWith(
        'uuid-1',
      );
    });
  });

  describe('updateResponse', () => {
    it('debería llamar a ResponsesService.update', async () => {
      const dto = {} as unknown as UpdateResponseDto;
      const expected = { id: 'uuid-1' };
      mockResponsesService.update.mockResolvedValue(expected);

      const result = await controller.updateResponse('uuid-1', dto);
      expect(result).toEqual(expected);
      expect(responsesService.update).toHaveBeenCalledWith('uuid-1', dto);
    });
  });
});
