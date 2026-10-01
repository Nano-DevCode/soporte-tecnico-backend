import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from 'src/users/services/users.service';
import { User } from 'src/users/entities/user.entity';
import { RefreshTokenService } from './refresh-token.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@ejemplo.com',
    password: 'hashed_password',
    role: { id: 'role-1' },
    staff: { department: { id: 'dep-1' } },
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            generateTokens: jest.fn().mockResolvedValue({
              accessToken: 'jwt-token-123',
              refreshToken: 'refresh-token-456',
              expiresIn: 900,
            }),
            rotateRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            revokeAllUserTokens: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    refreshTokenService = module.get(RefreshTokenService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@ejemplo.com',
      password: 'password123',
    };

    it('debe hacer login exitosamente y retornar token y refresh token', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(refreshTokenService.generateTokens).toHaveBeenCalledWith(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        staff: mockUser.staff,
        token: 'jwt-token-123',
        accessToken: 'jwt-token-123',
        refreshToken: 'refresh-token-456',
        expiresIn: 900,
      });

      expect(result).not.toHaveProperty('password');
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('checkAuthStatus', () => {
    it('debe retornar el usuario actual y renovar el token JWT', () => {
      jwtService.sign.mockReturnValue('new-token-123');

      const result = service.checkAuthStatus(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        idRole: mockUser.role.id,
        idDepartment: mockUser.staff.department.id,
      });

      expect(result).toEqual({
        ...mockUser,
        token: 'new-token-123',
      });
    });
  });

  describe('refreshTokens', () => {
    it('debe llamar a refreshTokenService.rotateRefreshToken y devolver el resultado', async () => {
      const rotated = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 900,
        user: { id: mockUser.id } as Partial<User>,
      };
      (refreshTokenService.rotateRefreshToken as jest.Mock).mockResolvedValue(
        rotated,
      );

      const result = await service.refreshTokens('old-refresh');

      expect(refreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(
        'old-refresh',
      );
      expect(result).toEqual({
        ...rotated,
        token: 'new-access',
      });
    });
  });

  describe('logout', () => {
    it('debe revocar el refresh token si fue provisto', async () => {
      await service.logout('refresh-to-revoke');
      expect(refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'refresh-to-revoke',
      );
    });
  });

  describe('logoutAll', () => {
    it('debe revocar todos los tokens del usuario', async () => {
      await service.logoutAll('user-uuid-1');
      expect(refreshTokenService.revokeAllUserTokens).toHaveBeenCalledWith(
        'user-uuid-1',
      );
    });
  });
});
