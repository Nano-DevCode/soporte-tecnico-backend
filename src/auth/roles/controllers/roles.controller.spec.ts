import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { RolesController } from './roles.controller';
import { RolesService } from '../services/roles.service';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';

describe('RolesController', () => {
  let controller: RolesController;
  let service: jest.Mocked<RolesService>;

  const mockRole: Role = {
    id: 'role-uuid-1',
    name: 'Coordinador',
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockRole),
            findAll: jest.fn().mockResolvedValue([mockRole]),
            findOne: jest.fn().mockResolvedValue(mockRole),
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

    controller = module.get<RolesController>(RolesController);
    service = module.get(RolesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO', async () => {
      const dto: CreateRoleDto = { name: 'Coordinador' };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockRole);
    });
  });

  describe('findAll', () => {
    it('debe llamar a service.findAll', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockRole]);
    });
  });

  describe('findOne', () => {
    it('debe llamar a service.findOne con el id', async () => {
      const result = await controller.findOne('role-uuid-1');
      expect(service.findOne).toHaveBeenCalledWith('role-uuid-1');
      expect(result).toEqual(mockRole);
    });
  });
});
