import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { RecuperatePasswordUserDto } from './dto/recuperate-password-user.dto';
import { ChangePasswordUserDto } from './dto/change-password-user.dto';
import { ChangeUserStatusDto } from './dto/change-status.dto';
import { User } from './entities/user.entity';
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
    it('debe retornar una lista de usuarios basada en el filtro', async () => {
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
    it('debe retornar un usuario por su ID', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-uuid-1');

      expect(service.findOne).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('debe crear un nuevo usuario', async () => {
      const createUserDto: CreateUserDto = {
        email: 'usuario.demo@ejemplo.com',
        password: 'password123',
        roleId: 'role-1',
        departmentId: 'dep-1',
        coordinationId: 'coord-1',
        idTelegram: '12345',
        name: 'Usuario',
        paternalSurname: 'Pérez',
        maternalSurname: 'González',
        num_control: 'EMP00001',
        rfc: 'DEMO900101XYZ',
      };

      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('recuperatePassword', () => {
    it('debe iniciar el proceso de recuperación de contraseña', async () => {
      const dto: RecuperatePasswordUserDto = {
        email: 'usuario.demo@ejemplo.com',
      };
      const expectedResponse = {
        message: 'events.users.instructionsSent',
        email: dto.email,
      };

      service.recuperatePassword.mockResolvedValue(expectedResponse);

      const result = await controller.recuperatePassword(dto);

      expect(service.recuperatePassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('passwordChange', () => {
    it('debe cambiar la contraseña del usuario autenticado', async () => {
      const dto: ChangePasswordUserDto = { password: 'new_password' };
      const expectedResponse = { message: 'Password updated successfully' };

      service.passwordChange.mockResolvedValue(expectedResponse);

      const result = await controller.passwordChange(dto, mockUser);

      expect(service.passwordChange).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('changeStatus', () => {
    it('debe cambiar el estado de un usuario', async () => {
      const dto: ChangeUserStatusDto = { status: false };
      const expectedResponse = { id: 'user-uuid-1', status: false };

      service.changeStatus.mockResolvedValue(expectedResponse);

      const result = await controller.changeStatus('user-uuid-1', dto);

      expect(service.changeStatus).toHaveBeenCalledWith('user-uuid-1', dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('update', () => {
    it('debe actualizar los datos de un usuario', async () => {
      const dto: UpdateUserDto = { name: 'Usuario Actualizado' };

      service.update.mockResolvedValue(mockUser);

      const result = await controller.update('user-uuid-1', dto);

      expect(service.update).toHaveBeenCalledWith('user-uuid-1', dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('debe eliminar un usuario por su ID', async () => {
      service.remove.mockResolvedValue(mockUser);

      const result = await controller.remove('user-uuid-1');

      expect(service.remove).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockUser);
    });
  });
});
