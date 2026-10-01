import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { Equipment } from 'src/equipments/entities/equipment.entity';
import { ConsumableMovement } from 'src/consumable-movements/entities/consumable-movement.entity';
import { TicketSurvey } from 'src/survey/entities/ticket-survey.entity';
import { Department } from 'src/departments/entities/department.entity';
import { IssueType } from 'src/issue_type/entities/issue_type.entity';
import { TicketHistoryService } from '../ticket-history/ticket-history.service';
import { AppCacheService } from 'src/common/services/app-cache.service';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';

describe('DashboardService (Reactive Cache Integration)', () => {
  let service: DashboardService;
  let mockCacheService: {
    generateKey: jest.Mock;
    wrap: jest.Mock;
  };

  const createMockRepo = () => ({
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getRawMany: jest.fn().mockResolvedValue([]),
      getRawOne: jest.fn().mockResolvedValue(null),
      getCount: jest.fn().mockResolvedValue(0),
    })),
    find: jest.fn().mockResolvedValue([]),
  });

  beforeEach(async () => {
    mockCacheService = {
      generateKey: jest.fn((prefix) => `${prefix}:hash`),
      wrap: jest.fn((key, fn) => fn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: createMockRepo(),
        },
        {
          provide: getRepositoryToken(Equipment),
          useValue: createMockRepo(),
        },
        {
          provide: getRepositoryToken(ConsumableMovement),
          useValue: createMockRepo(),
        },
        {
          provide: getRepositoryToken(TicketSurvey),
          useValue: createMockRepo(),
        },
        {
          provide: getRepositoryToken(Department),
          useValue: createMockRepo(),
        },
        {
          provide: getRepositoryToken(IssueType),
          useValue: createMockRepo(),
        },
        {
          provide: TicketHistoryService,
          useValue: {
            findAllStatus: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AppCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getCriticalServiceAvailability should invoke cacheService.wrap with generated key', async () => {
    const filters: DashboardFiltersDto = { department: 'dept-1' };
    const result = await service.getCriticalServiceAvailability(filters);

    expect(mockCacheService.generateKey).toHaveBeenCalledWith(
      'dashboard:availability',
      filters,
    );
    expect(mockCacheService.wrap).toHaveBeenCalledWith(
      'dashboard:availability:hash',
      expect.any(Function),
      300,
    );
    expect(result).toBe(100);
  });

  it('getSlaCompliance should invoke cacheService.wrap with 300s TTL', async () => {
    const filters: DashboardFiltersDto = {};
    const result = await service.getSlaCompliance(filters);

    expect(mockCacheService.generateKey).toHaveBeenCalledWith(
      'dashboard:sla_compliance',
      filters,
    );
    expect(mockCacheService.wrap).toHaveBeenCalledWith(
      'dashboard:sla_compliance:hash',
      expect.any(Function),
      300,
    );
    expect(result).toEqual({ percentage: 100, totalResolved: 0, slaMet: 0 });
  });

  it('getTicketsByDepartmentMetrics should invoke cacheService.wrap', async () => {
    const filters: DashboardFiltersDto = {};
    const result = await service.getTicketsByDepartmentMetrics(filters);

    expect(mockCacheService.generateKey).toHaveBeenCalledWith(
      'dashboard:by_department',
      filters,
    );
    expect(mockCacheService.wrap).toHaveBeenCalledWith(
      'dashboard:by_department:hash',
      expect.any(Function),
      300,
    );
    expect(result).toEqual([]);
  });

  it('getTicketsByStatus should invoke cacheService.wrap with 180s TTL', async () => {
    const filters: DashboardFiltersDto = {};
    const result = await service.getTicketsByStatus(filters);

    expect(mockCacheService.generateKey).toHaveBeenCalledWith(
      'dashboard:status',
      filters,
    );
    expect(mockCacheService.wrap).toHaveBeenCalledWith(
      'dashboard:status:hash',
      expect.any(Function),
      180,
    );
    expect(result).toEqual([]);
  });
});
