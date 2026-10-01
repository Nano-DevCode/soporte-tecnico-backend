import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { CacheController } from './cache.controller';
import { AppCacheService } from '../services/app-cache.service';

describe('CacheController', () => {
  let controller: CacheController;
  let mockCacheService: {
    getStats: jest.Mock;
    delByPattern: jest.Mock;
    clearAll: jest.Mock;
  };

  beforeEach(async () => {
    mockCacheService = {
      getStats: jest.fn().mockReturnValue({
        hits: 10,
        misses: 2,
        totalRequests: 12,
        hitRate: '83.33%',
        inMemoryEntries: 5,
        redisConnected: true,
      }),
      delByPattern: jest.fn().mockResolvedValue(4),
      clearAll: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CacheController],
      providers: [
        {
          provide: AppCacheService,
          useValue: mockCacheService,
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn((k: string) => k) },
        },
      ],
    }).compile();

    controller = module.get<CacheController>(CacheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getStats should return cache statistics', () => {
    const stats = controller.getStats();
    expect(mockCacheService.getStats).toHaveBeenCalled();
    expect(stats.hitRate).toBe('83.33%');
    expect(stats.hits).toBe(10);
  });

  it('clearCache with pattern should call delByPattern', async () => {
    const res = await controller.clearCache({ pattern: 'dashboard:*' });
    expect(mockCacheService.delByPattern).toHaveBeenCalledWith('dashboard:*');
    expect(res).toEqual({
      success: true,
      message:
        'Se purgaron las entradas coincidentes con el patrón "dashboard:*"',
      affected: 4,
    });
  });

  it('clearCache without pattern should call clearAll', async () => {
    const res = await controller.clearCache();
    expect(mockCacheService.clearAll).toHaveBeenCalled();
    expect(res).toEqual({
      success: true,
      message: 'Toda la memoria caché ha sido purgada con éxito.',
    });
  });
});
