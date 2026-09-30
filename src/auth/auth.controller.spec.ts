import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { type Response } from 'express';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from 'src/users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  // Mock del usuario
  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@ejemplo.com',
    staff: {
      name: 'Usuario Demo',
    },
  } as User;

  // Mock de la respuesta de express para evaluar la inyección de cookies
  let mockResponse: jest.Mocked<Partial<Response>>;

  // Constante de opciones de cookie para validaciones exactas
  const expectedCookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
  };

  beforeEach(async () => {
    // Reiniciamos el mock de Response en cada prueba
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
    it('debe iniciar sesión, establecer la cookie y retornar los datos del usuario sin el token', async () => {
      const loginDto: LoginUserDto = {
        email: 'test@ejemplo.com',
        password: 'password123',
      };

      const authResponse = {
        ...mockUser,
        token: 'fake-jwt-token',
      };

      // Simulamos que el servicio retorna el usuario y el token
      authService.login.mockResolvedValue(authResponse);

      const result = await controller.loginUser(
        loginDto,
        mockResponse as Response,
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto);

      // Validamos que se asigne la cookie con los parámetros correctos
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'fake-jwt-token',
        {
          ...expectedCookieOptions,
          maxAge: 1000 * 60 * 60 * 5, // 5 horas
        },
      );

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        staff: mockUser.staff,
      });
      expect(result).not.toHaveProperty('token');
    });
  });

  describe('checkAuthStatus', () => {
    it('debe renovar el token, actualizar la cookie y retornar los datos del usuario', () => {
      const authResponse = {
        ...mockUser,
        token: 'renewed-jwt-token',
      };

      authService.checkAuthStatus.mockReturnValue(authResponse);

      const result = controller.checkAuthStatus(
        mockUser,
        mockResponse as Response,
      );

      expect(authService.checkAuthStatus).toHaveBeenCalledWith(mockUser);

      // Validamos que se actualice la cookie con el nuevo tiempo de expiración
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        'renewed-jwt-token',
        {
          ...expectedCookieOptions,
          maxAge: 1000 * 60 * 60 * 4, // 4 horas
        },
      );

      // 👇 AQUÍ ESTÁ LA CORRECCIÓN: Validamos que retorne 'staff' en lugar de 'name'
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        staff: mockUser.staff,
      });
      expect(result).not.toHaveProperty('token');
    });
  });

  describe('logout', () => {
    it('debe eliminar la cookie y retornar el mensaje de éxito', () => {
      const result = controller.logout(mockResponse as Response);

      // Validamos que se limpie la cookie con las mismas opciones de seguridad
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'token',
        expectedCookieOptions,
      );

      // El mensaje se traduce a través del mock del I18nService
      expect(result).toEqual({ message: 'events.auth.logout' });
    });
  });

  describe('prueba', () => {
    it('debe retornar directamente el objeto del usuario inyectado', () => {
      const result = controller.prueba(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
});
