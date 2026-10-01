import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { StaffQueriesService } from './staff-queries.service';
import { Staff } from '../entities/staff.entity';
import { User } from '../entities/user.entity';

describe('StaffQueriesService', () => {
  let service: StaffQueriesService;
  let staffRepository: jest.Mocked<Repository<Staff>>;

  const mockStaff: Staff = {
    id: 'staff-uuid-1',
    name: 'Carlos',
    paternalSurname: 'López',
    maternalSurname: 'García',
    num_control: 'TECH001',
    rfc: 'LOGC900101XYZ',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-uuid-1',
      email: 'carlos@example.com',
      role: { id: 'role-1', name: 'Técnico' },
    } as unknown as User,
  } as Staff;

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockStaff], 1]),
    getMany: jest.fn().mockResolvedValue([mockStaff]),
    getCount: jest.fn().mockResolvedValue(1),
    getRawMany: jest.fn().mockResolvedValue([
      {
        id: 'staff-uuid-1',
        name: 'Carlos',
        paternal_surname: 'López',
        maternal_surname: 'García',
        num_control: 'TECH001',
        email: 'carlos@example.com',
        total_assigned: 10,
        total_resolved: 8,
        pending_tickets: 2,
        effectiveness_rate: 80,
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffQueriesService,
        {
          provide: getRepositoryToken(Staff),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<StaffQueriesService>(StaffQueriesService);
    staffRepository = module.get(getRepositoryToken(Staff));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe retornar todos los miembros de staff', async () => {
      staffRepository.find.mockResolvedValue([mockStaff]);
      const result = await service.findAll();
      expect(staffRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockStaff]);
    });
  });

  describe('findAllWithRoleSpecific', () => {
    it('debe retornar staffs con fullName y metadata de paginación', async () => {
      const result = await service.findAllWithRoleSpecific({
        limit: 10,
        offset: 0,
        query: 'Carlos',
      });

      expect(staffRepository.createQueryBuilder).toHaveBeenCalledWith('staff');
      expect(result.staffs).toHaveLength(1);
      expect(result.staffs[0].fullName).toBe('Carlos López García');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findAllTechnicalByIds', () => {
    it('debe retornar lista de técnicos cuando existen', async () => {
      staffRepository.find.mockResolvedValue([mockStaff]);
      const result = await service.findAllTechnicalByIds(['staff-uuid-1']);
      expect(result).toEqual([mockStaff]);
    });

    it('debe retornar arreglo vacío si los ids están vacíos', async () => {
      const result = await service.findAllTechnicalByIds([]);
      expect(result).toEqual([]);
    });

    it('debe lanzar NotFoundException si algún id falta', async () => {
      staffRepository.find.mockResolvedValue([]);
      await expect(
        service.findAllTechnicalByIds(['staff-inexistente']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllTechnical & findAllTechnical2', () => {
    it('debe retornar técnicos en findAllTechnical', async () => {
      staffRepository.find.mockResolvedValue([mockStaff]);
      const result = await service.findAllTechnical();
      expect(result).toEqual([mockStaff]);
    });

    it('debe retornar técnicos en findAllTechnical2', async () => {
      const result = await service.findAllTechnical2();
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual([mockStaff]);
    });
  });

  describe('findAllCoordinators & Managers', () => {
    it('debe buscar coordinadores', async () => {
      staffRepository.find.mockResolvedValue([mockStaff]);
      const result = await service.findAllCoordinators();
      expect(result).toEqual([mockStaff]);
    });

    it('debe buscar jefes de departamento', async () => {
      staffRepository.find.mockResolvedValue([mockStaff]);
      const result = await service.findAllDepartmentManagers();
      expect(result).toEqual([mockStaff]);
    });
  });

  describe('getTechniciansResolutionKpi', () => {
    it('debe calcular métricas de KPI de técnicos', async () => {
      const result = await service.getTechniciansResolutionKpi({
        limit: 10,
        offset: 0,
      });

      expect(result.staffs).toHaveLength(1);
      expect(result.staffs[0].metrics.effectivenessRate).toBe(80);
      expect(result.meta.total).toBe(1);
    });
  });
});
