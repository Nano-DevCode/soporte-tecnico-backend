import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';

import { UserRegistrationService } from './user-registration.service';
import { CoordinationsService } from 'src/coordinations/services/coordinations.service';
import { RolesService } from 'src/auth/roles/services/roles.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

jest.mock('bcrypt');

describe('UserRegistrationService', () => {
  let service: UserRegistrationService;
  let dataSource: jest.Mocked<DataSource>;

  const mockEntityManager = {
    create: jest.fn().mockImplementation((_entity, data) => ({
      id: 'generated-id',
      ...data,
    })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    findOne: jest.fn().mockResolvedValue({
      id: 'user-uuid-1',
      staff: { id: 'staff-uuid-1' },
    }),
    merge: jest.fn().mockImplementation((_entity, target, source) => {
      return Object.assign(target, source);
    }),
  } as unknown as EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRegistrationService,
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
          provide: CoordinationsService,
          useValue: {
            findUnCordination: jest.fn().mockResolvedValue('default-coord-id'),
          },
        },
        {
          provide: RolesService,
          useValue: {
            findIsCoordinator: jest
              .fn()
              .mockResolvedValue('coordinator-role-id'),
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

    service = module.get<UserRegistrationService>(UserRegistrationService);
    dataSource = module.get(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('debe registrar un usuario y su staff dentro de una transacción', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const dto: CreateUserDto = {
        email: 'nuevo@institucion.edu.mx',
        password: 'Password123!',
        name: 'Carlos',
        paternalSurname: 'López',
        maternalSurname: 'Mora',
        num_control: 'EMP0099',
        rfc: 'LOPM900101XYZ',
        roleId: 'role-1',
        departmentId: 'dep-1',
      };

      const result = await service.register(dto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
      expect(result).toBe('generated-id');
    });
  });

  describe('update', () => {
    it('debe actualizar usuario y staff dentro de una transacción', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');

      const dto: UpdateUserDto = {
        name: 'Nombre Editado',
        password: 'NewPassword123!',
      };

      await service.update('user-uuid-1', dto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockEntityManager.merge).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
    });
  });
});
