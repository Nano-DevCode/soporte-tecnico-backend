import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditAction, AuditLog } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let mockAuditRepo: any;

  beforeEach(async () => {
    mockAuditRepo = {
      create: jest.fn((dto) => ({ id: 'mock-id', ...dto })),
      save: jest.fn((log) => Promise.resolve(log)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditRepo,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordLog', () => {
    it('should create and save an audit log', async () => {
      const data = {
        entityName: 'Ticket',
        entityId: 't-123',
        action: AuditAction.CREATE,
      };

      const result = await service.recordLog(data);
      expect(mockAuditRepo.create).toHaveBeenCalledWith(data);
      expect(mockAuditRepo.save).toHaveBeenCalled();
      expect(result.entityName).toBe('Ticket');
    });
  });

  describe('findAll', () => {
    it('should build query with filters and return paginated data', async () => {
      const result = await service.findAll({
        limit: 10,
        offset: 0,
        entityName: 'Ticket',
        action: AuditAction.UPDATE,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });

      expect(mockAuditRepo.createQueryBuilder).toHaveBeenCalledWith('audit');
      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          lastPage: 0,
        },
      });
    });
  });

  describe('findByEntity', () => {
    it('should find logs for specific entity ordered by createdAt DESC', async () => {
      mockAuditRepo.find.mockResolvedValue([
        { id: '1', entityName: 'Ticket', entityId: 't-1' },
      ]);

      const result = await service.findByEntity('Ticket', 't-1');
      expect(mockAuditRepo.find).toHaveBeenCalledWith({
        where: { entityName: 'Ticket', entityId: 't-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return log if found', async () => {
      mockAuditRepo.findOne.mockResolvedValue({ id: 'uuid-1' });
      const result = await service.findById('uuid-1');
      expect(result.id).toBe('uuid-1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockAuditRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
