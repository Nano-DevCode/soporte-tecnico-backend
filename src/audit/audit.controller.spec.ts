import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';

describe('AuditController', () => {
  let controller: AuditController;
  let mockAuditService: {
    findAll: jest.Mock;
    findByEntity: jest.Mock;
    findById: jest.Mock;
  };

  beforeEach(async () => {
    mockAuditService = {
      findAll: jest.fn().mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, lastPage: 0 },
      }),
      findByEntity: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn((k: string) => k) },
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should delegate to service.findAll', async () => {
    const filters = { limit: 10, action: AuditAction.CREATE };
    const result = await controller.findAll(filters);

    expect(mockAuditService.findAll).toHaveBeenCalledWith(filters);
    expect(result.data).toEqual([]);
  });

  it('findByEntity should delegate to service.findByEntity', async () => {
    const result = await controller.findByEntity('Ticket', 't-123');

    expect(mockAuditService.findByEntity).toHaveBeenCalledWith(
      'Ticket',
      't-123',
    );
    expect(result).toEqual([]);
  });

  it('findById should delegate to service.findById', async () => {
    const result = await controller.findById(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(mockAuditService.findById).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000000',
    );
    expect(result).toEqual({ id: 'log-1' });
  });
});
