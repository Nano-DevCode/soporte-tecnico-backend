import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { FilterUserDto } from '../dto/filter-user.dto';
import { RecuperatePasswordUserDto } from '../dto/account/recuperate-password-user.dto';
import { ChangePasswordUserDto } from '../dto/account/change-password-user.dto';
import { ChangeUserStatusDto } from '../dto/account/change-status.dto';
import { User } from '../entities/user.entity';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'usuario.demo@ejemplo.com',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            profile: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            recuperatePassword: jest.fn(),
            passwordChange: jest.fn(),
            changeStatus: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getPreferences: jest.fn(),
            updatePreferences: jest.fn(),
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

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('debe llamar a service.findAll con los filtros correctos', async () => {
      const filterDto: FilterUserDto = { limit: 10, offset: 0 };
      const expectedResult = {
        users: [mockUser],
        meta: { total: 1, page: 1, lastPage: 1 },
      };
      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('profile', () => {
    it('debe retornar el perfil del usuario autenticado', async () => {
      service.profile.mockResolvedValue(mockUser);

      const result = await controller.profile(mockUser);

      expect(service.profile).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOne', () => {
    it('debe buscar un usuario por id', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-uuid-1');

      expect(service.findOne).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO', async () => {
      const createDto: CreateUserDto = {
        email: 'nuevo@ejemplo.com',
        password: 'password123',
        roleId: 'role-1',
        departmentId: 'dep-1',
        name: 'Nuevo',
        paternalSurname: 'User',
        maternalSurname: 'Demo',
        num_control: 'NEW001',
        rfc: 'NEW0010101XYZ',
      };
      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('recuperatePassword', () => {
    it('debe llamar a service.recuperatePassword', async () => {
      const dto: RecuperatePasswordUserDto = {
        email: 'usuario.demo@ejemplo.com',
      };
      const response = {
        message: 'Correo enviado',
        email: 'usuario.demo@ejemplo.com',
      };
      service.recuperatePassword.mockResolvedValue(response);

      const result = await controller.recuperatePassword(dto);

      expect(service.recuperatePassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(response);
    });
  });

  describe('passwordChange', () => {
    it('debe llamar a service.passwordChange', async () => {
      const dto: ChangePasswordUserDto = { password: 'newPassword123!' };
      const response = { message: 'Contraseña actualizada' };
      service.passwordChange.mockResolvedValue(response);

      const result = await controller.passwordChange(dto, mockUser);

      expect(service.passwordChange).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(response);
    });
  });

  describe('changeStatus', () => {
    it('debe cambiar el status del usuario', async () => {
      const dto: ChangeUserStatusDto = { status: false };
      const response = { id: 'user-uuid-1', status: false };
      service.changeStatus.mockResolvedValue(response);

      const result = await controller.changeStatus('user-uuid-1', dto);

      expect(service.changeStatus).toHaveBeenCalledWith('user-uuid-1', dto);
      expect(result).toEqual(response);
    });
  });

  describe('update', () => {
    it('debe actualizar los datos del usuario', async () => {
      const dto: UpdateUserDto = { name: 'Nombre Actualizado' };
      service.update.mockResolvedValue(mockUser);

      const result = await controller.update('user-uuid-1', dto);

      expect(service.update).toHaveBeenCalledWith('user-uuid-1', dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('debe eliminar el usuario', async () => {
      service.remove.mockResolvedValue(mockUser);

      const result = await controller.remove('user-uuid-1');

      expect(service.remove).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockUser);
    });
  });
});
