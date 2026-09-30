import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';

// Hacemos un mock de bcrypt para evitar que se ejecute la encriptación real durante las pruebas
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  // Mock simulando la estructura del usuario
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);

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

    it('debe hacer login exitosamente y retornar token (omitiendo el password)', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );

      // Validamos que el token se haya firmado con los datos correctos
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        idRole: mockUser.role.id,
        idDepartment: mockUser.staff.department.id,
      });

      // Validamos la respuesta exitosa
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        staff: mockUser.staff,
        token: 'jwt-token-123',
      });

      // Validamos explícitamente que la contraseña haya sido removida
      expect(result).not.toHaveProperty('password');
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Falla el password

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('debe lanzar UnauthorizedException si el usuario no existe (y usar fakeHash para evitar timing attacks)', async () => {
      // Simulamos que el usuario NO se encontró en la BD
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      // Validamos que aunque el usuario no exista, bcrypt compare contra el hash falso
      // Esto asegura que tu mitigación de timing attacks funciona perfectamente
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      );
    });
  });

  describe('checkAuthStatus', () => {
    it('debe retornar el usuario actual y renovar el token JWT', () => {
      jwtService.sign.mockReturnValue('new-jwt-token-456');

      const result = service.checkAuthStatus(mockUser);

      // Verificamos que se firme un nuevo token con el payload correcto
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        idRole: mockUser.role.id,
        idDepartment: mockUser.staff.department.id,
      });

      // Verificamos que retorne el usuario completo anexando el nuevo token
      expect(result).toEqual({
        ...mockUser,
        token: 'new-jwt-token-456',
      });
    });
  });
});
