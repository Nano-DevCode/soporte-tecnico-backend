import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { TicketsSeedService } from './tickets-seed.service';
import { Ticket } from '../../entities/ticket.entity';
import { Status, TicketHistory } from 'src/ticket-history/entities';
import { SchoolPeriod } from 'src/school-periods/entities/school-period.entity';
import { IssueType } from 'src/issue_type/entities/issue_type.entity';
import { Tag } from 'src/tags/entities/tag.entity';
import { Staff } from 'src/users/entities/staff.entity';
import { Attend } from 'src/attends/entities/attend.entity';

describe('TicketsSeedService', () => {
  let service: TicketsSeedService;
  let dataSource: jest.Mocked<DataSource>;
  let mockQueryRunner: any;

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        count: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsSeedService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TicketsSeedService>(TicketsSeedService);
    dataSource = module.get(DataSource);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException if tickets already exist', async () => {
    mockQueryRunner.manager.count.mockResolvedValue(5);

    await expect(service.runSeed()).rejects.toThrow(ConflictException);
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should throw BadRequestException if no staff members exist', async () => {
    mockQueryRunner.manager.count.mockResolvedValue(0);
    // ensureStatuses
    mockQueryRunner.manager.find.mockImplementation((entity: any) => {
      if (entity === Status) return Promise.resolve([]);
      if (entity === IssueType) return Promise.resolve([]);
      if (entity === Tag) return Promise.resolve([]);
      if (entity === Staff) return Promise.resolve([]); // No staff
      return Promise.resolve([]);
    });

    mockQueryRunner.manager.create.mockImplementation(
      (entity: any, data: any) => data,
    );
    mockQueryRunner.manager.save.mockImplementation((entity: any, data: any) =>
      Promise.resolve({ id: 'uuid', ...data }),
    );
    mockQueryRunner.manager.findOne.mockResolvedValue({
      id: 'period-uuid',
      name: '20261',
    });

    await expect(service.runSeed()).rejects.toThrow(BadRequestException);
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should successfully execute ticket seed when DB is empty of tickets', async () => {
    mockQueryRunner.manager.count.mockResolvedValue(0);

    const mockStaff = [
      { id: 'staff-1', user: { role: { name: 'admin' } } },
      { id: 'staff-2', user: { role: { name: 'coordinador' } } },
      { id: 'staff-3', user: { role: { name: 'tecnico' } } },
    ];

    mockQueryRunner.manager.find.mockImplementation((entity: any) => {
      if (entity === Status) return Promise.resolve([]);
      if (entity === IssueType) return Promise.resolve([]);
      if (entity === Tag) return Promise.resolve([]);
      if (entity === Staff) return Promise.resolve(mockStaff);
      return Promise.resolve([]);
    });

    mockQueryRunner.manager.findOne.mockImplementation((entity: any) => {
      if (entity === SchoolPeriod) {
        return Promise.resolve({
          id: 'period-uuid',
          name: '20261',
          is_active: true,
        });
      }
      return Promise.resolve(null);
    });

    mockQueryRunner.manager.create.mockImplementation(
      (entity: any, data: any) => ({
        ...data,
        id: 'generated-uuid',
      }),
    );

    mockQueryRunner.manager.save.mockImplementation((entity: any, data: any) =>
      Promise.resolve({
        id: 'saved-uuid',
        ...data,
      }),
    );

    const result = await service.runSeed();

    expect(result.complete).toBe(true);
    expect(result.totalTickets).toBe(6);
    expect(result.tickets.length).toBe(6);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });
});
