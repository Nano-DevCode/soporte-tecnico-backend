import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { RefreshTokenService } from './refresh-token.service';
import { RedisService } from 'src/common/services/redis.service';
import { UsersService } from 'src/users/services/users.service';
import { User } from 'src/users/entities/user.entity';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let mockJwtService: Record<string, jest.Mock>;
  let mockConfigService: Record<string, jest.Mock>;
  let mockRedisService: Record<string, jest.Mock | boolean>;
  let mockUsersService: Record<string, jest.Mock>;
  let mockI18nService: Record<string, jest.Mock>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'user@soporte.com',
    password: 'hashed-password',
    status: true,
    role: { id: 'role-1' },
    staff: { department: { id: 'dep-1' } },
  } as User;

  beforeEach(async () => {
    mockJwtService = {
      sign: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'secret-access';
        if (key === 'JWT_REFRESH_SECRET') return 'secret-refresh';
        return null;
      }),
    };

    mockRedisService = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
      sadd: jest.fn().mockResolvedValue(1),
      srem: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      expire: jest.fn().mockResolvedValue(true),
    };

    mockUsersService = {
      findById: jest.fn(),
    };

    mockI18nService = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  describe('generateTokens', () => {
    it('should generate and persist access and refresh tokens in Redis', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('access-token-123')
        .mockReturnValueOnce('refresh-token-456');

      const result = await service.generateTokens(mockUser);

      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-456');
      expect(result.expiresIn).toBe(900);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining(`refresh_token:${mockUser.id}:`),
        'active',
        expect.any(Number),
      );
      expect(mockRedisService.sadd).toHaveBeenCalledWith(
        `user_tokens:${mockUser.id}`,
        expect.any(String),
      );
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate valid refresh token, delete old token and return new token pair', async () => {
      const validPayload = { sub: 'user-uuid-1', jti: 'jti-123' };
      mockJwtService.verifyAsync.mockResolvedValue(validPayload);
      mockRedisService.get.mockResolvedValue('active');
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.rotateRefreshToken(
        'valid-raw-refresh-token',
      );

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'refresh_token:user-uuid-1:jti-123',
      );
      expect(mockRedisService.srem).toHaveBeenCalledWith(
        'user_tokens:user-uuid-1',
        'jti-123',
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.id).toBe('user-uuid-1');
    });

    it('should detect reuse attack and revoke ALL user sessions if token not in Redis', async () => {
      const reusedPayload = { sub: 'user-uuid-1', jti: 'already-used-jti' };
      mockJwtService.verifyAsync.mockResolvedValue(reusedPayload);
      mockRedisService.get.mockResolvedValue(null); // Not found in Redis!
      mockRedisService.smembers.mockResolvedValue([
        'active-jti-1',
        'active-jti-2',
      ]);

      await expect(service.rotateRefreshToken('reused-token')).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify that all user tokens were deleted
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'refresh_token:user-uuid-1:active-jti-1',
        'refresh_token:user-uuid-1:active-jti-2',
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'user_tokens:user-uuid-1',
      );
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.rotateRefreshToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      await expect(service.rotateRefreshToken('')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('should decode and delete token from Redis', async () => {
      mockJwtService.decode.mockReturnValue({
        sub: 'user-uuid-1',
        jti: 'jti-to-revoke',
      });

      await service.revokeRefreshToken('token-to-revoke');

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'refresh_token:user-uuid-1:jti-to-revoke',
      );
      expect(mockRedisService.srem).toHaveBeenCalledWith(
        'user_tokens:user-uuid-1',
        'jti-to-revoke',
      );
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should delete all user tokens from Redis', async () => {
      mockRedisService.smembers.mockResolvedValue(['jti-1', 'jti-2']);

      await service.revokeAllUserTokens('user-uuid-1');

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'refresh_token:user-uuid-1:jti-1',
        'refresh_token:user-uuid-1:jti-2',
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'user_tokens:user-uuid-1',
      );
    });
  });
});
