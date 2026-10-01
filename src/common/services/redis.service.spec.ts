import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let mockConfigService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'DB_HOST_REDIS') return 'localhost';
        if (key === 'REDIS_PORT') return 6379;
        if (key === 'REDIS_PASSWORD') return 'testpass';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('degraded / disconnected mode', () => {
    it('get should return null gracefully if disconnected', async () => {
      const result = await service.get('any-key');
      expect(result).toBeNull();
    });

    it('set should not throw if disconnected', async () => {
      await expect(service.set('key', 'val', 60)).resolves.not.toThrow();
    });

    it('del should return 0 if disconnected', async () => {
      const result = await service.del('key');
      expect(result).toBe(0);
    });

    it('smembers should return empty array if disconnected', async () => {
      const result = await service.smembers('set-key');
      expect(result).toEqual([]);
    });

    it('sadd should return 0 if disconnected', async () => {
      const result = await service.sadd('set-key', 'item');
      expect(result).toBe(0);
    });

    it('srem should return 0 if disconnected', async () => {
      const result = await service.srem('set-key', 'item');
      expect(result).toBe(0);
    });

    it('expire should return false if disconnected', async () => {
      const result = await service.expire('key', 10);
      expect(result).toBe(false);
    });

    it('keys should return empty array if disconnected', async () => {
      const result = await service.keys('test:*');
      expect(result).toEqual([]);
    });

    it('delByPattern should return 0 if disconnected', async () => {
      const result = await service.delByPattern('test:*');
      expect(result).toBe(0);
    });
  });

  describe('when connected with mock client', () => {
    let mockClient: Record<string, jest.Mock>;

    beforeEach(() => {
      mockClient = {
        get: jest.fn().mockResolvedValue('stored-value'),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        sadd: jest.fn().mockResolvedValue(1),
        smembers: jest.fn().mockResolvedValue(['token1', 'token2']),
        srem: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        keys: jest.fn().mockResolvedValue(['key1', 'key2']),
        quit: jest.fn().mockResolvedValue('OK'),
        disconnect: jest.fn(),
      };

      service['client'] = mockClient as unknown as import('ioredis').Redis;
      service['isConnected'] = true;
    });

    it('should call client.get and return value', async () => {
      const result = await service.get('test-key');
      expect(mockClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe('stored-value');
    });

    it('should call client.set with TTL', async () => {
      await service.set('test-key', 'value', 300);
      expect(mockClient.set).toHaveBeenCalledWith(
        'test-key',
        'value',
        'EX',
        300,
      );
    });

    it('should call client.del and return deleted count', async () => {
      const result = await service.del('k1', 'k2');
      expect(mockClient.del).toHaveBeenCalledWith('k1', 'k2');
      expect(result).toBe(1);
    });

    it('should call client.smembers and return set items', async () => {
      const result = await service.smembers('user:tokens');
      expect(mockClient.smembers).toHaveBeenCalledWith('user:tokens');
      expect(result).toEqual(['token1', 'token2']);
    });

    it('should call client.srem and return removed count', async () => {
      const result = await service.srem('user:tokens', 'token1');
      expect(mockClient.srem).toHaveBeenCalledWith('user:tokens', 'token1');
      expect(result).toBe(1);
    });

    it('should call client.expire and return true', async () => {
      const result = await service.expire('test-key', 60);
      expect(mockClient.expire).toHaveBeenCalledWith('test-key', 60);
      expect(result).toBe(true);
    });

    it('should call client.keys and return matching keys', async () => {
      const result = await service.keys('dashboard:*');
      expect(mockClient.keys).toHaveBeenCalledWith('dashboard:*');
      expect(result).toEqual(['key1', 'key2']);
    });

    it('should call client.delByPattern and delete matching keys', async () => {
      mockClient.del.mockResolvedValue(2);
      const result = await service.delByPattern('dashboard:*');
      expect(mockClient.keys).toHaveBeenCalledWith('dashboard:*');
      expect(mockClient.del).toHaveBeenCalledWith('key1', 'key2');
      expect(result).toBe(2);
    });

    it('should return 0 in delByPattern if no keys match', async () => {
      mockClient.keys.mockResolvedValue([]);
      const result = await service.delByPattern('empty:*');
      expect(result).toBe(0);
      expect(mockClient.del).not.toHaveBeenCalled();
    });
  });
});
