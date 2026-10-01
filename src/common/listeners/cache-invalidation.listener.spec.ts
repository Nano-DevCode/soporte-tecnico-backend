import { Test, TestingModule } from '@nestjs/testing';
import { CacheInvalidationListener } from './cache-invalidation.listener';
import { AppCacheService } from '../services/app-cache.service';

describe('CacheInvalidationListener', () => {
  let listener: CacheInvalidationListener;
  let mockCacheService: {
    delByPattern: jest.Mock;
  };

  beforeEach(async () => {
    mockCacheService = {
      delByPattern: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInvalidationListener,
        {
          provide: AppCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    listener = module.get<CacheInvalidationListener>(CacheInvalidationListener);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  it('handleTicketEvents should invalidate dashboard and sla caches', async () => {
    await listener.handleTicketEvents();

    expect(mockCacheService.delByPattern).toHaveBeenCalledWith('dashboard:*');
    expect(mockCacheService.delByPattern).toHaveBeenCalledWith('sla:*');
  });

  it('handleDepartmentEvents should invalidate catalog:departments and dashboard caches', async () => {
    await listener.handleDepartmentEvents();

    expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
      'catalog:departments:*',
    );
    expect(mockCacheService.delByPattern).toHaveBeenCalledWith('dashboard:*');
  });

  it('handleIssueTypeEvents should invalidate catalog:issue_types and dashboard caches', async () => {
    await listener.handleIssueTypeEvents();

    expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
      'catalog:issue_types:*',
    );
    expect(mockCacheService.delByPattern).toHaveBeenCalledWith('dashboard:*');
  });

  it('handleSlaEvents should invalidate dashboard and sla caches', async () => {
    await listener.handleSlaEvents();

    expect(mockCacheService.delByPattern).toHaveBeenCalledWith('dashboard:*');
    expect(mockCacheService.delByPattern).toHaveBeenCalledWith('sla:*');
  });
});
