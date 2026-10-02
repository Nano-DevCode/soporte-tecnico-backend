import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketQueriesService } from './ticket-queries.service';
import { Ticket } from '../entities/ticket.entity';
import { User } from 'src/users/entities/user.entity';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';
import { FilterTicketsDto } from '../dto/filter-tickets.dto';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';

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

describe('TicketQueriesService', () => {
  let service: TicketQueriesService;
  let ticketRepository: jest.Mocked<Repository<Ticket>>;

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
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    from: jest.fn().mockReturnThis(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketQueriesService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TicketQueriesService>(TicketQueriesService);
    ticketRepository = module.get(getRepositoryToken(Ticket));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(ticketRepository).toBeDefined();
  });

  describe('findAllForUser', () => {
    it('should return empty pagination if user has no staff', async () => {
      const user = { role: { name: ValidRole.jefe } } as User;
      const result = await service.findAllForUser({}, user);
      expect(result).toEqual({ data: [], total: 0, meta: expect.any(Object) });
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return empty pagination if no ticket ids found', async () => {
      const user = {
        role: { name: ValidRole.jefe },
        staff: { id: 'staff-1' },
      } as unknown as User;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllForUser({}, user);
      expect(result).toEqual({ data: [], total: 0, meta: expect.any(Object) });
    });

    it('should apply filters and return mapped tickets for jefe', async () => {
      const user = {
        role: { name: ValidRole.jefe },
        staff: { id: 'staff-1' },
      } as unknown as User;

      const filterDto: FilterTicketsDto = {
        search: 'TEST',
        priority: 'ALTA',
        status: TicketStatus.RECIBIDA,
        department: 'dept-1',
        school_period: 'period-1',
        issue_type: 'issue-1',
        tags: ['redes'],
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        sortBy: 'folio',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{ id: 'ticket-1' }],
        1,
      ]);
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'ticket-1' }]);

      const result = await service.findAllForUser(filterDto, user);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.created_at >= :startDate',
        { startDate: '2026-01-01 00:00:00' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ticket.created_at <= :endDate',
        { endDate: '2026-01-31 23:59:59' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(ticket.folio ILIKE :search OR jefe_depto.name ILIKE :search)',
        { search: '%TEST%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'jefe_depto.id = :idStaff',
        { idStaff: 'staff-1' },
      );
      expect(result).toHaveProperty('data');
    });

    it('should handle tecnico role with internal_folio in search and active attend filter', async () => {
      const user = {
        role: { name: ValidRole.tecnico },
        staff: { id: 'staff-2' },
      } as unknown as User;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{ id: 'ticket-2' }],
        1,
      ]);
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'ticket-2' }]);

      await service.findAllForUser({ search: 'TEC' }, user);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(ticket.folio ILIKE :search OR ticket.internal_folio ILIKE :search OR jefe_depto.name ILIKE :search)',
        { search: '%TEC%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'technician.id = :idStaff',
        { idStaff: 'staff-2' },
      );
    });

    it('should handle coordinador role', async () => {
      const user = {
        role: { name: ValidRole.coordinador },
        staff: { id: 'coord-1' },
      } as unknown as User;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{ id: 'ticket-3' }],
        1,
      ]);
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'ticket-3' }]);

      await service.findAllForUser({}, user);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'coordinator.id = :idStaff',
        { idStaff: 'coord-1' },
      );
    });
  });

  describe('findCurrentForUser', () => {
    it('should return empty pagination if user has no staff', async () => {
      const user = { role: { name: ValidRole.jefe } } as User;
      const result = await service.findCurrentForUser({}, user);
      expect(result).toEqual({ data: [], total: 0, meta: expect.any(Object) });
    });

    it('should filter current statuses for superAdmin', async () => {
      const user = {
        role: { name: ValidRole.superAdmin },
        staff: { id: 'admin-1' },
      } as unknown as User;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{ id: 'ticket-1' }],
        1,
      ]);
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'ticket-1' }]);

      const result = await service.findCurrentForUser({}, user);

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
      expect(result).toHaveProperty('data');
    });

    it('should return empty pagination for unknown role', async () => {
      const user = {
        role: { name: 'unknown' as unknown as ValidRole },
        staff: { id: 'other-1' },
      } as unknown as User;

      const result = await service.findCurrentForUser({}, user);
      expect(result).toEqual({ data: [], total: 0, meta: expect.any(Object) });
    });
  });

  describe('findAllClosedAndArchived', () => {
    it('should filter by default closed and archived statuses', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{ id: 'ticket-1' }],
        1,
      ]);
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'ticket-1' }]);

      const result = await service.findAllClosedAndArchived({});

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'latest_status_sort.code IN (:...globalStatuses)',
        {
          globalStatuses: [TicketStatus.CERRADA, TicketStatus.ARCHIVADA],
        },
      );
      expect(result).toHaveProperty('data');
    });

    it('should return empty pagination if requested status is not closed/archived', async () => {
      const result = await service.findAllClosedAndArchived({
        status: TicketStatus.RECIBIDA,
      });

      expect(result).toEqual({ data: [], total: 0, meta: expect.any(Object) });
      expect(mockQueryBuilder.getManyAndCount).not.toHaveBeenCalled();
    });

    it('should filter by specific allowed status if valid', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{ id: 'ticket-1' }],
        1,
      ]);
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'ticket-1' }]);

      await service.findAllClosedAndArchived({
        status: TicketStatus.CERRADA,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'latest_status_sort.code = :status',
        { status: TicketStatus.CERRADA },
      );
    });
  });

  describe('findAllByStatusForSelect', () => {
    it('should query and return tickets by statuses', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'ticket-1' }]);

      const result = await service.findAllByStatusForSelect({
        status: [TicketStatus.RECIBIDA],
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'latest_status_sort.code IN (:...status)',
        { status: [TicketStatus.RECIBIDA] },
      );
      expect(result).toEqual([{ id: 'ticket-1' }]);
    });
  });

  describe('findAllPaginated', () => {
    it('should query tickets with pagination and search', async () => {
      const dto: PaginationWithPageDto = {
        limit: 10,
        page: 1,
        search: 'TICKET-001',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{ id: 'ticket-1' }],
        1,
      ]);

      const result = await service.findAllPaginated(dto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(ticket.folio ILIKE :search)',
        { search: '%TICKET-001%' },
      );
      expect(result).toHaveProperty('data');
    });
  });
});
