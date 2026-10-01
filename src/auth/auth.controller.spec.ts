import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { type Request, type Response } from 'express';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from 'src/users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@ejemplo.com',
    staff: {
      name: 'Usuario Demo',
    },
  } as User;

  let mockResponse: jest.Mocked<Partial<Response>>;

  const expectedCookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
  };

  beforeEach(async () => {
    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            checkAuthStatus: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest
              .fn()
              .mockResolvedValue({ message: 'events.auth.logout' }),
            logoutAll: jest.fn().mockResolvedValue({ message: 'revoked' }),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('loginUser', () => {
    it('debe iniciar sesión, establecer las cookies y retornar los datos del usuario sin los tokens', async () => {
      const loginDto: LoginUserDto = {
        email: 'test@ejemplo.com',
        password: 'password123',
      };

      const authResponse = {
        ...mockUser,
        token: 'fake-jwt-token',
        accessToken: 'fake-jwt-token',
        refreshToken: 'fake-refresh-token',
        expiresIn: 900,
      };

      authService.login.mockResolvedValue(authResponse);

      const result = await controller.loginUser(
        loginDto,
        mockResponse as Response,
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'fake-jwt-token',
        {
          ...expectedCookieOptions,
          maxAge: 1000 * 60 * 60 * 5,
        },
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'fake-refresh-token',
        {
          ...expectedCookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 7,
        },
      );

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        staff: mockUser.staff,
      });
      expect(result).not.toHaveProperty('token');
      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  describe('refreshToken', () => {
    it('debe rotar tokens usando la cookie y establecer las nuevas cookies', async () => {
      const mockReq = {
        cookies: { refreshToken: 'cookie-refresh-token' },
      } as unknown as Request;

      const refreshResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
        user: { id: mockUser.id },
      };

      authService.refreshTokens.mockResolvedValue(refreshResult);

      const result = await controller.refreshToken(
        mockReq,
        {},
        mockResponse as Response,
      );

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'cookie-refresh-token',
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'new-access-token',
        expect.any(Object),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
        expect.any(Object),
      );
      expect(result).toEqual(refreshResult);
    });
  });

  describe('checkAuthStatus', () => {
    it('debe renovar el token, actualizar la cookie y retornar los datos del usuario', () => {
      const authResponse = {
        ...mockUser,
        token: 'fake-renewed-jwt-token',
      };

      authService.checkAuthStatus.mockReturnValue(authResponse);

      const result = controller.checkAuthStatus(
        mockUser,
        mockResponse as Response,
      );

      expect(authService.checkAuthStatus).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'fake-renewed-jwt-token',
        {
          ...expectedCookieOptions,
          maxAge: 1000 * 60 * 60 * 4,
        },
      );
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        staff: mockUser.staff,
      });
    });
  });

  describe('logout', () => {
    it('debe llamar a authService.logout, limpiar cookies y retornar mensaje', async () => {
      const mockReq = {
        cookies: { refreshToken: 'token-to-revoke' },
      } as unknown as Request;

      const result = await controller.logout(
        mockReq,
        {},
        mockResponse as Response,
      );

      expect(authService.logout).toHaveBeenCalledWith('token-to-revoke');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'token',
        expectedCookieOptions,
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expectedCookieOptions,
      );
      expect(result).toEqual({ message: 'events.auth.logout' });
    });
  });

  describe('logoutAll', () => {
    it('debe revocar todas las sesiones del usuario y limpiar cookies', async () => {
      const result = await controller.logoutAll(
        mockUser,
        mockResponse as Response,
      );

      expect(authService.logoutAll).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'token',
        expectedCookieOptions,
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expectedCookieOptions,
      );
      expect(result).toEqual({ message: 'revoked' });
    });
  });
});
