import { Test, TestingModule } from '@nestjs/testing';
import { AppCacheService } from './app-cache.service';
import { RedisService } from './redis.service';

describe('AppCacheService', () => {
  let service: AppCacheService;
  let mockRedisService: {
    connected: boolean;
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    delByPattern: jest.Mock;
  };

  beforeEach(async () => {
    mockRedisService = {
      connected: true,
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppCacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AppCacheService>(AppCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateKey', () => {
    it('should return prefix if params are empty or omitted', () => {
      expect(service.generateKey('catalog:departments')).toBe(
        'catalog:departments',
      );
      expect(service.generateKey('catalog:departments', {})).toBe(
        'catalog:departments',
      );
    });

    it('should generate a deterministic key regardless of object key order', () => {
      const key1 = service.generateKey('dashboard:sla', {
        status: 'SOLUCIONADA',
        period: 2,
      });
      const key2 = service.generateKey('dashboard:sla', {
        period: 2,
        status: 'SOLUCIONADA',
      });
      expect(key1).toBe(key2);
      expect(key1.startsWith('dashboard:sla:')).toBe(true);
    });
  });

  describe('get and set with Redis connected', () => {
    it('should retrieve from Redis if available and record hit', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ message: 'cached' }),
      );

      const result = await service.get<{ message: string }>('test:key');
      expect(mockRedisService.get).toHaveBeenCalledWith('test:key');
      expect(result).toEqual({ message: 'cached' });

      const stats = service.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);
    });

    it('should store in Redis with ttl and memory cache', async () => {
      await service.set('test:key', { data: 123 }, 120);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'test:key',
        JSON.stringify({ data: 123 }),
        120,
      );
    });

    it('should record miss if key not found anywhere', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.get('missing:key');
      expect(result).toBeNull();

      const stats = service.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
    });
  });

  describe('in-memory fallback when Redis is disconnected', () => {
    beforeEach(() => {
      mockRedisService.connected = false;
    });

    it('should store and retrieve from in-memory cache', async () => {
      await service.set('local:key', { item: 'value' }, 60);
      expect(mockRedisService.set).not.toHaveBeenCalled();

      const result = await service.get<{ item: string }>('local:key');
      expect(result).toEqual({ item: 'value' });
      expect(mockRedisService.get).not.toHaveBeenCalled();

      const stats = service.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.inMemoryEntries).toBe(1);
    });

    it('should return null and delete expired in-memory items', async () => {
      // Forzar expiración simulando timestamp pasado
      await service.set('expired:key', 'old', 1);
      const entry = (service as any).memoryCache.get('expired:key');
      if (entry) {
        entry.expiresAt = Date.now() - 1000;
      }

      const result = await service.get('expired:key');
      expect(result).toBeNull();
      expect((service as any).memoryCache.has('expired:key')).toBe(false);
    });
  });

  describe('wrap (cache-aside)', () => {
    it('should return cached value if present without executing fetchFn', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify({ count: 42 }));
      const fetchFn = jest.fn();

      const result = await service.wrap('test:count', fetchFn, 300);
      expect(result).toEqual({ count: 42 });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should execute fetchFn, store result, and return when cache misses', async () => {
      mockRedisService.get.mockResolvedValue(null);
      const fetchFn = jest.fn().mockResolvedValue({ count: 99 });

      const result = await service.wrap('test:count', fetchFn, 300);
      expect(result).toEqual({ count: 99 });
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'test:count',
        JSON.stringify({ count: 99 }),
        300,
      );
    });

    it('should not cache if fetchFn throws', async () => {
      mockRedisService.get.mockResolvedValue(null);
      const fetchFn = jest.fn().mockRejectedValue(new Error('DB failure'));

      await expect(service.wrap('test:err', fetchFn, 300)).rejects.toThrow(
        'DB failure',
      );
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });
  });

  describe('del and delByPattern', () => {
    it('should delete key from memory and Redis', async () => {
      await service.set('key:1', 'val');
      await service.del('key:1');

      expect(mockRedisService.del).toHaveBeenCalledWith('key:1');
      expect((service as any).memoryCache.has('key:1')).toBe(false);
    });

    it('should delete keys by pattern in Redis and in-memory map', async () => {
      mockRedisService.delByPattern.mockResolvedValue(3);

      await service.set('dashboard:1', 'd1');
      await service.set('dashboard:2', 'd2');
      await service.set('catalog:1', 'c1');

      const deletedCount = await service.delByPattern('dashboard:*');
      expect(mockRedisService.delByPattern).toHaveBeenCalledWith('dashboard:*');
      expect(deletedCount).toBe(3);

      expect((service as any).memoryCache.has('dashboard:1')).toBe(false);
      expect((service as any).memoryCache.has('dashboard:2')).toBe(false);
      expect((service as any).memoryCache.has('catalog:1')).toBe(true);
    });
  });

  describe('getStats and clearAll', () => {
    it('should report statistics accurately', async () => {
      mockRedisService.get.mockResolvedValueOnce(JSON.stringify('hit'));
      mockRedisService.get.mockResolvedValueOnce(null);

      await service.get('k1'); // hit
      await service.get('k2'); // miss

      const stats = service.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(2);
      expect(stats.hitRate).toBe('50.00%');
      expect(stats.redisConnected).toBe(true);
    });

    it('should clear all cache and reset counters in clearAll', async () => {
      await service.set('temp:1', 'v1');
      await service.clearAll();

      expect(mockRedisService.delByPattern).toHaveBeenCalledWith('*');
      expect((service as any).memoryCache.size).toBe(0);

      const stats = service.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});
