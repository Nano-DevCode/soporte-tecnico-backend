import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketReportsService } from './ticket-reports.service';
import { Ticket } from '../entities/ticket.entity';
import { IssueTypeService } from 'src/issue_type/issue_type.service';
import { DepartmentsService } from 'src/departments/services/departments.service';
import { Department } from 'src/departments/entities/department.entity';
import { IssueType } from 'src/issue_type/entities/issue_type.entity';

describe('TicketReportsService', () => {
  let service: TicketReportsService;
  let ticketRepository: jest.Mocked<Repository<Ticket>>;
  let departmentsService: jest.Mocked<DepartmentsService>;
  let issueTypeService: jest.Mocked<IssueTypeService>;

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockDepartmentsService = {
    findAll: jest.fn(),
  };

  const mockIssueTypeService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketReportsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockRepository,
        },
        {
          provide: DepartmentsService,
          useValue: mockDepartmentsService,
        },
        {
          provide: IssueTypeService,
          useValue: mockIssueTypeService,
        },
      ],
    }).compile();

    service = module.get<TicketReportsService>(TicketReportsService);
    ticketRepository = module.get(getRepositoryToken(Ticket));
    departmentsService = module.get(DepartmentsService);
    issueTypeService = module.get(IssueTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(ticketRepository).toBeDefined();
    expect(departmentsService).toBeDefined();
    expect(issueTypeService).toBeDefined();
  });

  describe('getTicketsSummaryReport', () => {
    it('should generate report matrix with totals', async () => {
      mockDepartmentsService.findAll.mockResolvedValue([
        { id: 'd1', name: 'Sistemas' } as Department,
        { id: 'd2', name: 'Quimica' } as Department,
      ]);

      mockIssueTypeService.findAll.mockResolvedValue([
        { id: 'i1', name: 'Hardware' } as IssueType,
        { id: 'i2', name: 'Software' } as IssueType,
      ]);

      mockQueryBuilder.getRawMany.mockResolvedValue([
        { departamento: 'Sistemas', issueType: 'Hardware', cantidad: '5' },
        { departamento: 'Sistemas', issueType: 'Software', cantidad: '3' },
        { departamento: 'Quimica', issueType: 'Hardware', cantidad: '2' },
      ]);

      const result = await service.getTicketsSummaryReport({
        school_period: 'period-uuid',
      });

      expect(result.issueTypes).toEqual(['Hardware', 'Software']);
      expect(result.totalsRow.total).toBe(10);
      expect(result.totalsRow['Hardware']).toBe(7);
      expect(result.totalsRow['Software']).toBe(3);

      const sistemasRow = result.data.find(
        (d) => d.departamento === 'Sistemas',
      );
      expect(sistemasRow?.total).toBe(8);
      expect(sistemasRow?.['Hardware']).toBe(5);
      expect(sistemasRow?.['Software']).toBe(3);
    });

    it('should handle dynamic unexpected department and issueType', async () => {
      mockDepartmentsService.findAll.mockResolvedValue([]);
      mockIssueTypeService.findAll.mockResolvedValue([]);

      mockQueryBuilder.getRawMany.mockResolvedValue([
        { departamento: null, issueType: null, cantidad: '4' },
      ]);

      const result = await service.getTicketsSummaryReport({
        school_period: 'period-uuid',
      });

      expect(result.issueTypes).toContain('Sin Clasificar');
      expect(result.totalsRow.total).toBe(4);
    });
  });
});
