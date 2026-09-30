import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from '../entities/ticket.entity';
import { IssueTypeService } from '../../issue_type/issue_type.service';
import { DepartmentsService } from '../../departments/departments.service';
import { I18nService } from 'nestjs-i18n';
import { Repository, EntityManager } from 'typeorm';
import { NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ResponsePdfsService } from '../../response-pdfs/response-pdfs.service';
import { User } from 'src/users/entities/user.entity';
import { FilterTicketsDto } from '../dto/filter-tickets.dto';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';
import { PaginationWithPageDto } from '../../common/dtos/paginationWithPage.dto';
import { Department } from 'src/departments/entities/department.entity';
import { IssueType } from 'src/issue_type/entities/issue_type.entity';

jest.mock('../mappers/find-all-ticket.mapper', () => ({
  FindAllTicketMapper: {
    toResponseArray: jest.fn().mockImplementation((data: unknown[]) => data),
  },
}));

jest.mock('src/common/pagination/paginationResponse', () => ({
  PaginationResponse: jest
    .fn()
    .mockImplementation((data: unknown, meta: unknown) => ({
      ...(data as object),
      meta,
    })),
}));

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketRepository: jest.Mocked<Repository<Ticket>>;
  let issueTypeService: jest.Mocked<IssueTypeService>;
  let departmentsService: jest.Mocked<DepartmentsService>;
  let i18n: jest.Mocked<I18nService>;

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereInIds: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    distinctOn: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    getRawMany: jest.fn(),
    from: jest.fn().mockReturnThis(),
  };

  const mockEntityManager = {
    findOne: jest.fn(),
  } as unknown as EntityManager;

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
    manager: mockEntityManager,
  };

  const mockIssueTypeService = {
    findAll: jest.fn(),
  };

  const mockDepartmentsService = {
    findAll: jest.fn(),
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
        TicketsService,
        { provide: getRepositoryToken(Ticket), useValue: mockRepository },
        { provide: IssueTypeService, useValue: mockIssueTypeService },
        { provide: DepartmentsService, useValue: mockDepartmentsService },
        { provide: I18nService, useValue: mockI18nService },
        { provide: ResponsePdfsService, useValue: mockResponsePdfsService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketRepository = module.get(getRepositoryToken(Ticket));
    issueTypeService = module.get(IssueTypeService);
    departmentsService = module.get(DepartmentsService);
    i18n = module.get(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForUser', () => {
    it('debería retornar datos vacíos si el usuario no tiene staff.id', async () => {
      const user = { role: { name: ValidRole.jefe } } as User;
      const filter = {} as FilterTicketsDto;

      const result = await service.findAllForUser(filter, user);
      expect(result).toEqual({
        data: [],
        total: 0,
        meta: { limit: 5, page: 1, search: undefined },
      });
    });

    it('debería retornar paginación vacía si no se encuentran tickets', async () => {
      const user = {
        staff: { id: 'staff-1' },
        role: { name: ValidRole.jefe },
      } as User;
      const filter = { limit: 10, page: 1 } as FilterTicketsDto;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllForUser(filter, user);
      expect(result).toEqual({
        data: [],
        total: 0,
        meta: { limit: 10, page: 1, search: undefined },
      });
    });

    it('debería consultar y retornar tickets correctamente para un jefe', async () => {
      const user = {
        staff: { id: 'staff-1' },
        role: { name: ValidRole.jefe },
      } as User;
      const filter = {
        limit: 10,
        page: 1,
        search: 'test',
        tags: ['tag1'],
      } as FilterTicketsDto;
      const mockRawIds = [{ id: 'ticket-1' }, { id: 'ticket-2' }];
      const mockData = [{ id: 'ticket-1' }, { id: 'ticket-2' }];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockRawIds, 2]);
      mockQueryBuilder.getMany.mockResolvedValue(mockData);

      const result = await service.findAllForUser(filter, user);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'jefe_depto.id = :idStaff',
        { idStaff: 'staff-1' },
      );
      expect(mockQueryBuilder.whereInIds).toHaveBeenCalledWith([
        'ticket-1',
        'ticket-2',
      ]);
      expect(result).toEqual({
        data: mockData,
        total: 2,
        meta: { limit: 10, page: 1, search: 'test' },
      });
    });
  });

  describe('findCurrentForUser', () => {
    it('debería filtrar por estado según el rol (ej. superAdmin)', async () => {
      const user = {
        staff: { id: 'staff-1' },
        role: { name: ValidRole.superAdmin },
      } as User;
      const filter = {} as FilterTicketsDto;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findCurrentForUser(filter, user);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'latest_status_sort.code IN (:...statuses)',
        {
          statuses: [
            TicketStatus.RECIBIDA,
            TicketStatus.CANALIZADA,
            TicketStatus.ASIGNADA,
            TicketStatus.ATENDIENDO,
            TicketStatus.SOLUCIONADA,
            TicketStatus.NO_SOLUCIONADA,
          ],
        },
      );
    });

    it('debería retornar datos si hay tickets', async () => {
      const user = {
        staff: { id: 'staff-1' },
        role: { name: ValidRole.tecnico },
      } as User;
      const filter = { limit: 5, page: 2 } as FilterTicketsDto;
      const mockRawIds = [{ id: 't1' }];
      const mockData = [{ id: 't1' }];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockRawIds, 1]);
      mockQueryBuilder.getMany.mockResolvedValue(mockData);

      const result = await service.findCurrentForUser(filter, user);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'technician.id = :idStaff',
        { idStaff: 'staff-1' },
      );
      expect(result).toEqual({
        data: mockData,
        total: 1,
        meta: { limit: 5, page: 2, search: undefined },
      });
    });
  });

  describe('findAllClosedAndArchived', () => {
    it('debería buscar únicamente tickets cerrados y archivados por defecto', async () => {
      const filter = {} as FilterTicketsDto;
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllClosedAndArchived(filter);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'latest_status_sort.code IN (:...globalStatuses)',
        { globalStatuses: [TicketStatus.CERRADA, TicketStatus.ARCHIVADA] },
      );
    });
  });

  describe('findAllByStatusForSelect', () => {
    it('debería buscar tickets por el status específico proporcionado', async () => {
      const filter = {
        status: TicketStatus.RECIBIDA,
      };
      const mockData = [{ id: 't1' }];

      mockQueryBuilder.getMany.mockResolvedValue(mockData);

      const result = await service.findAllByStatusForSelect(filter);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'latest_status_sort.code IN (:...status)',
        { status: TicketStatus.RECIBIDA },
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('findAllPaginated', () => {
    it('debería devolver tickets paginados', async () => {
      const filter = {
        limit: 10,
        page: 1,
        search: 'folio',
      } as PaginationWithPageDto;
      const mockData = [{ id: 't1' }];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      const result = await service.findAllPaginated(filter);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(ticket.folio ILIKE :search)',
        { search: '%folio%' },
      );
      expect(result).toEqual({
        data: mockData,
        total: 1,
        meta: { limit: 10, page: 1, search: 'folio' },
      });
    });
  });

  describe('findOne', () => {
    it('debería retornar un ticket si existe', async () => {
      const mockTicket = { id: 't1' } as Ticket;
      ticketRepository.findOne.mockResolvedValue(mockTicket);

      const result = await service.findOne('t1');

      expect(result).toEqual(mockTicket);
      expect(ticketRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't1' } }),
      );
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      ticketRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('t1')).rejects.toThrow(NotFoundException);
      expect(i18n.t).toHaveBeenCalledWith('errors.tickets.not_found', {
        args: { id: 't1' },
      });
    });
  });

  describe('findOneByIdWithDetailsOrFail', () => {
    it('debería buscar detalles, filtrar atenciones inactivas y asignar currentStatusCode', async () => {
      const mockTicket = {
        id: 't1',
        ticket_histories: [
          { status: { code: 'NUEVA' } },
          { status: { code: 'ASIGNADA' } },
        ],
        attends: [
          { id: 1, is_active: true },
          { id: 2, is_active: false },
        ],
      } as unknown as Ticket;

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTicket);

      const result = await service.findOneByIdWithDetailsOrFail('t1');

      expect(result.attends).toHaveLength(1);
      expect(result.currentStatusCode).toBe('ASIGNADA');
    });

    it('debería lanzar NotFoundException si el ticket no existe', async () => {
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOneByIdWithDetailsOrFail('t1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAuthorizedDetails', () => {
    it('debería permitir acceso si es superAdmin', async () => {
      const user = { role: { name: ValidRole.superAdmin } } as User;
      const mockTicket = {
        id: 't1',
        ticket_histories: [{ status: { code: 'NUEVA' } }],
      } as unknown as Ticket;

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTicket);

      const result = await service.findAuthorizedDetails('t1', user);
      expect(result.id).toBe('t1');
    });

    it('debería lanzar ForbiddenException si no está autorizado (jefe incorrecto)', async () => {
      const user = {
        role: { name: ValidRole.jefe },
        staff: { id: 'staff-2' },
      } as User;
      const mockTicket = {
        id: 't1',
        jefe_depto: { id: 'staff-1' },
        ticket_histories: [],
      } as unknown as Ticket;

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTicket);

      await expect(service.findAuthorizedDetails('t1', user)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debería permitir acceso si el técnico está asignado activo', async () => {
      const user = {
        role: { name: ValidRole.tecnico },
        staff: { id: 'tech-1' },
      } as User;
      const mockTicket = {
        id: 't1',
        attends: [{ technician: { id: 'tech-1' }, is_active: true }],
        ticket_histories: [],
      } as unknown as Ticket;

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTicket);

      const result = await service.findAuthorizedDetails('t1', user);
      expect(result.id).toBe('t1');
    });
  });

  describe('findAllDetailsByIdOrFail', () => {
    it('debería retornar todos los detalles y el código de estado actual', async () => {
      const mockTicket = {
        id: 't1',
        ticket_histories: [{ status: { code: 'CERRADA' } }],
        attends: [{ is_active: true }],
      } as unknown as Ticket;

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTicket);

      const result = await service.findAllDetailsByIdOrFail('t1');
      expect(result.currentStatusCode).toBe('CERRADA');
    });
  });

  describe('findOneByIdOrFail', () => {
    it('debería retornar el ticket o lanzar excepción', async () => {
      const mockTicket = { id: 't1' } as Ticket;
      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(mockTicket);

      const result = await service.findOneByIdOrFail('t1');
      expect(result).toEqual(mockTicket);

      (mockEntityManager.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findOneByIdOrFail('t1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTicketsSummaryReport', () => {
    it('debería construir el reporte resumen correctamente', async () => {
      const mockDepts = [{ id: 'd1', name: 'Depto A' }];
      const mockIssues = [{ id: 'i1', name: 'Issue X' }];
      const mockRawData = [
        { departamento: 'Depto A', issueType: 'Issue X', cantidad: '5' },
      ];

      departmentsService.findAll.mockResolvedValue(mockDepts as Department[]);
      issueTypeService.findAll.mockResolvedValue(
        mockIssues as unknown as IssueType[],
      );
      mockQueryBuilder.getRawMany.mockResolvedValue(mockRawData);

      const filter = { school_period: 'period-1' };
      const result = await service.getTicketsSummaryReport(filter);

      expect(result.issueTypes).toContain('Issue X');
      expect(result.totalsRow.total).toBe(5);
      expect(result.totalsRow['Issue X']).toBe(5);

      const deptoRow = result.data.find((d) => d.departamento === 'Depto A');
      expect(deptoRow?.total).toBe(5);
      expect(deptoRow?.['Issue X']).toBe(5);
    });
  });

  describe('Utilidades', () => {
    it('getCurrentStatus debería devolver el último status', () => {
      const ticket = {
        ticket_histories: [{ status: 'A' }, { status: 'B' }],
      } as unknown as Ticket;
      expect(service.getCurrentStatus(ticket)).toBe('B');
    });

    it('getCurrentHistory debería devolver la última historia', () => {
      const ticket = {
        ticket_histories: [{ id: 1 }, { id: 2 }],
      } as unknown as Ticket;
      expect(service.getCurrentHistory(ticket)).toEqual({ id: 2 });
    });
  });
});
