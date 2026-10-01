import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  DeepPartial,
  DeleteResult,
  EntityManager,
  Repository,
  UpdateResult,
} from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Staff } from '../entities/staff.entity';
import { Role } from 'src/auth/roles/entities/role.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Coordination } from 'src/coordinations/entities/coordination.entity';

import { GmailService } from 'src/gmail/services/gmail.service';
import { CoordinationsService } from 'src/coordinations/services/coordinations.service';
import { RolesService } from 'src/auth/roles/services/roles.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { FilterUserDto } from '../dto/filter-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { UserAccountService } from './user-account.service';
import { UserRegistrationService } from './user-registration.service';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;
  let gmailBotService: jest.Mocked<GmailService>;

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  const mockRole: Role = {
    id: 'role-1',
    name: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
  };

  const mockDepartment: Department = {
    id: 'dep-1',
    name: 'Sistemas y Computación',
    priority: 1,
    status: true,
    acronym: 'SYC',
    staffMembers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    equipment: [],
    consumableMovements: [],
  };

  const mockCoordination: Coordination = {
    id: 'coord-1',
    name: 'Coordinación de Sistemas',
    staffMembers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStaff: Staff = {
    id: 'staff-1',
    idTelegram: '12345',
    name: 'Usuario Demo',
    paternalSurname: 'Pérez',
    maternalSurname: 'González',
    num_control: 'EMP00001',
    rfc: 'DEMO900101XYZ',
    createdAt: new Date(),
    updatedAt: new Date(),
    department: mockDepartment,
    coordination: mockCoordination,
    user: {} as User,
    ticketsJefeDepto: [],
    ticketsCoordinator: [],
    attends: [],
    itAssetsMovementsOut: [],
    toolsMovementsOut: [],
    checkFieldsBeforeInsert: jest.fn(),
    checkFieldsBeforeUpdate: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'usuario.demo@ejemplo.com',
    password: 'hashed_password',
    avatar: 'https://avatar.png',
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: mockRole,
    staff: mockStaff,
    checkFieldsBeforeInsert: jest.fn(),
    checkFieldsBeforeUpdate: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
  };

  const mockEntityManager = {
    create: jest.fn(
      <T extends object>(entityClass: new () => T, dto: DeepPartial<T>): T => {
        return { id: 'generated-id', ...dto } as unknown as T;
      },
    ),
    save: jest.fn(<T>(entity: T): Promise<T> => Promise.resolve(entity)),
    findOne: jest.fn().mockImplementation(() => Promise.resolve(mockUser)),

    merge: jest.fn(
      <T extends object>(
        _entityClass: new () => T,
        target: T,
        source: DeepPartial<T>,
      ): T => {
        return Object.assign(target, source);
      },
    ),
  } as unknown as EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        UserAccountService,
        UserRegistrationService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
            query: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest
              .fn()
              .mockImplementation(
                (cb: (manager: EntityManager) => Promise<unknown>) =>
                  cb(mockEntityManager),
              ),
          },
        },
        {
          provide: GmailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: CoordinationsService,
          useValue: {
            findUnCordination: jest.fn().mockResolvedValue('default-coord-id'),
          },
        },
        {
          provide: RolesService,
          useValue: {
            findIsCoordinator: jest.fn().mockResolvedValue('coord-role-id'),
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

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);
    gmailBotService = module.get(GmailService);

    jest.clearAllMocks();

    service['logger'].error = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ========================================================================
     CREATE
  ======================================================================== */
  describe('create', () => {
    it('debe crear un usuario y su staff dentro de una transacción exitosamente', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      const createUserDto: CreateUserDto = {
        email: 'usuario.demo@ejemplo.com',
        password: 'password123',
        roleId: 'role-1',
        departmentId: 'dep-1',
        coordinationId: 'coord-1',
        idTelegram: '12345',
        name: 'Usuario Demo',
        paternalSurname: 'Pérez',
        maternalSurname: 'González',
        num_control: 'EMP00001',
        rfc: 'DEMO900101XYZ',
      };

      const result = await service.create(createUserDto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
      expect(service.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('debe manejar errores de base de datos durante la creación', async () => {
      const dbError: DatabaseError = {
        name: 'QueryFailedError',
        message: 'duplicate key value violates unique constraint',
        code: '23505',
        detail: 'Key (email)=(usuario.demo@ejemplo.com) already exists.',
      };

      dataSource.transaction.mockRejectedValueOnce(dbError);

      await expect(service.create({} as CreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  /* ========================================================================
     FIND ALL
  ======================================================================== */
  describe('findAll', () => {
    it('debe retornar lista de usuarios con su metadata de paginación', async () => {
      const filterDto: FilterUserDto = {
        limit: 10,
        offset: 0,
        query: 'Usuario',
        roleId: 'role-1',
        status: true,
      };

      const result = await service.findAll(filterDto);

      expect(usersRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual({
        users: [mockUser],
        meta: {
          total: 1,
          page: 1,
          lastPage: 1,
        },
      });
    });
  });

  /* ========================================================================
     FIND ONE
  ======================================================================== */
  describe('findOne', () => {
    it('debe retornar un usuario si existe', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-uuid-1');

      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-uuid-1' } }),
      );
      expect(result).toEqual(mockUser);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /* ========================================================================
     UPDATE
  ======================================================================== */
  describe('update', () => {
    it('debe actualizar usuario y staff correctamente dentro de una transacción', async () => {
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue(
        'new_hashed_password',
      );
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

      const updateDto: UpdateUserDto = {
        name: 'Usuario Actualizado',
        password: 'newpassword123',
      };

      const result = await service.update('user-uuid-1', updateDto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockEntityManager.merge).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUser);
    });
  });

  /* ========================================================================
     REMOVE
  ======================================================================== */
  describe('remove', () => {
    it('debe eliminar un usuario y retornarlo', async () => {
      const deleteResult: DeleteResult = { raw: [], affected: 1 };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      usersRepository.delete.mockResolvedValue(deleteResult);

      const result = await service.remove('user-uuid-1');

      expect(service.findOne).toHaveBeenCalledWith('user-uuid-1');
      expect(usersRepository.delete).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockUser);
    });
  });

  /* ========================================================================
     CHANGE STATUS / ACTIVATE / DEACTIVATE
  ======================================================================== */
  describe('changeStatus', () => {
    it('debe actualizar el estado del usuario exitosamente', async () => {
      const updateResult: UpdateResult = {
        raw: [],
        affected: 1,
        generatedMaps: [],
      };
      usersRepository.update.mockResolvedValue(updateResult);

      const result = await service.changeStatus('user-uuid-1', {
        status: false,
      });

      expect(usersRepository.update).toHaveBeenCalledWith('user-uuid-1', {
        status: false,
      });
      expect(result).toEqual({ id: 'user-uuid-1', status: false });
    });

    it('debe lanzar NotFoundException si no afecta a ningún registro', async () => {
      const updateResult: UpdateResult = {
        raw: [],
        affected: 0,
        generatedMaps: [],
      };
      usersRepository.update.mockResolvedValue(updateResult);

      await expect(
        service.changeStatus('invalid-id', { status: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /* ========================================================================
     PASSWORD CHANGE & RECUPERATE
  ======================================================================== */
  describe('passwordChange', () => {
    it('debe cambiar la contraseña y enviar un correo electrónico de notificación', async () => {
      const updateResult: UpdateResult = {
        raw: [],
        affected: 1,
        generatedMaps: [],
      };
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(updateResult);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      const result = await service.passwordChange(
        { password: 'new_password' },
        mockUser,
      );

      expect(usersRepository.update).toHaveBeenCalledWith('user-uuid-1', {
        password: 'hashed_new_password',
      });
      expect(gmailBotService.sendEmail).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });
  });

  describe('recuperatePassword', () => {
    it('debe generar una contraseña temporal y enviarla por correo', async () => {
      const updateResult: UpdateResult = {
        raw: [],
        affected: 1,
        generatedMaps: [],
      };
      jest.spyOn(service, 'findByEmail').mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(updateResult);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_temp_password');

      const result = await service.recuperatePassword({
        email: 'usuario.demo@ejemplo.com',
      });

      expect(service.findByEmail).toHaveBeenCalledWith(
        'usuario.demo@ejemplo.com',
      );
      expect(usersRepository.update).toHaveBeenCalled();
      expect(gmailBotService.sendEmail).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'events.users.instructionsSent',
        email: 'usuario.demo@ejemplo.com',
      });
    });

    it('debe lanzar NotFoundException si el correo no está registrado', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValue(null);

      await expect(
        service.recuperatePassword({ email: 'noencontrado@ejemplo.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /* ========================================================================
     HANDLE DB EXCEPTIONS (Manejo de Errores PostgreSQL)
  ======================================================================== */
  describe('handleDBExceptions', () => {
    it('debe lanzar ConflictException para duplicados de email (error 23505)', () => {
      const dbError: DatabaseError = {
        name: 'QueryFailedError',
        message: 'duplicate key',
        code: '23505',
        detail: 'Key (email)=(usuario.demo@ejemplo.com) already exists.',
      };
      expect(() => service['handleDBExeptions'](dbError)).toThrow(
        ConflictException,
      );
    });

    it('debe lanzar ConflictException para duplicados de rfc (error 23505)', () => {
      const dbError: DatabaseError = {
        name: 'QueryFailedError',
        message: 'duplicate key',
        code: '23505',
        detail: 'Key (rfc)=(DEMO900101XYZ) already exists.',
      };
      expect(() => service['handleDBExeptions'](dbError)).toThrow(
        ConflictException,
      );
    });

    it('debe lanzar ConflictException para duplicados de idTelegram (error 23505)', () => {
      const dbError: DatabaseError = {
        name: 'QueryFailedError',
        message: 'duplicate key',
        code: '23505',
        detail: 'Key (idTelegram)=(12345) already exists.',
      };
      expect(() => service['handleDBExeptions'](dbError)).toThrow(
        ConflictException,
      );
    });

    it('debe lanzar BadRequestException para violaciones de Foreign Key (error 23503)', () => {
      const dbError: DatabaseError = {
        name: 'QueryFailedError',
        message: 'foreign key constraint',
        code: '23503',
        detail: 'FK violation',
      };
      expect(() => service['handleDBExeptions'](dbError)).toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar InternalServerErrorException para errores no mapeados', () => {
      const stdoutSpy = jest
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true);
      const stderrSpy = jest
        .spyOn(process.stderr, 'write')
        .mockImplementation(() => true);
      jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

      const err = new Error('Unknown Error');
      expect(() => service['handleDBExeptions'](err)).toThrow(
        InternalServerErrorException,
      );

      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    });
  });
});
