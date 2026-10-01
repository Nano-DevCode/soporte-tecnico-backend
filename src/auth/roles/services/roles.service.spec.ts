import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { RolesService } from './roles.service';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';

describe('RolesService', () => {
  let service: RolesService;
  let rolesRepository: jest.Mocked<Repository<Role>>;

  const mockRole: Role = {
    id: 'role-uuid-1',
    name: 'Coordinador',
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            create: jest.fn().mockReturnValue(mockRole),
            save: jest.fn().mockResolvedValue(mockRole),
            find: jest.fn().mockResolvedValue([mockRole]),
            findOne: jest.fn().mockResolvedValue(mockRole),
            findOneBy: jest.fn().mockResolvedValue(mockRole),
            clear: jest.fn().mockResolvedValue(undefined),
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

    service = module.get<RolesService>(RolesService);
    rolesRepository = module.get(getRepositoryToken(Role));

    jest.clearAllMocks();
    service['logger'].error = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un rol exitosamente', async () => {
      const dto: CreateRoleDto = { name: 'Coordinador' };
      const result = await service.create(dto);
      expect(rolesRepository.create).toHaveBeenCalledWith(dto);
      expect(rolesRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockRole);
    });

    it('debe manejar error 23505 lanzando BadRequestException', async () => {
      rolesRepository.save.mockRejectedValueOnce({
        code: '23505',
        detail: 'Role already exists',
      });

      await expect(service.create({ name: 'Coordinador' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll & findAll2', () => {
    it('debe retornar lista de roles filtrada en findAll', async () => {
      const result = await service.findAll();
      expect(rolesRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockRole]);
    });

    it('debe retornar todos los roles en findAll2', async () => {
      const result = await service.findAll2();
      expect(rolesRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockRole]);
    });
  });

  describe('findIsCoordinator', () => {
    it('debe retornar el id del rol Coordinador si existe', async () => {
      const result = await service.findIsCoordinator();
      expect(rolesRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Coordinador' },
      });
      expect(result).toBe('role-uuid-1');
    });

    it('debe lanzar NotFoundException si no existe el rol Coordinador', async () => {
      rolesRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findIsCoordinator()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar el rol por id', async () => {
      const result = await service.findOne('role-uuid-1');
      expect(rolesRepository.findOneBy).toHaveBeenCalledWith({
        id: 'role-uuid-1',
      });
      expect(result).toEqual(mockRole);
    });

    it('debe lanzar NotFoundException si el rol no existe', async () => {
      rolesRepository.findOneBy.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteAllRoles', () => {
    it('debe limpiar la tabla de roles', async () => {
      const result = await service.deleteAllRoles();
      expect(rolesRepository.clear).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('handleDBExceptions', () => {
    it('debe lanzar InternalServerErrorException en otros errores', () => {
      expect(() =>
        service['handleDBExceptions'](new Error('Unknown Error')),
      ).toThrow(InternalServerErrorException);
    });
  });
});
