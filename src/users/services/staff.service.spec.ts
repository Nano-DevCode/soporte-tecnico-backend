import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffQueriesService } from './staff-queries.service';
import { Staff } from '../entities/staff.entity';
import { CreateStaffDto } from '../dto/staff/create-staff.dto';
import { UpdateStaffDto } from '../dto/staff/update-staff.dto';

describe('StaffService', () => {
  let service: StaffService;
  let staffRepository: jest.Mocked<Repository<Staff>>;
  let staffQueriesService: jest.Mocked<StaffQueriesService>;

  const mockStaff: Staff = {
    id: 'staff-uuid-1',
    name: 'Carlos',
    paternalSurname: 'López',
    maternalSurname: 'García',
    num_control: 'TECH001',
    rfc: 'LOGC900101XYZ',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Staff;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        {
          provide: getRepositoryToken(Staff),
          useValue: {
            create: jest.fn().mockReturnValue(mockStaff),
            save: jest.fn().mockResolvedValue(mockStaff),
            findOne: jest.fn().mockResolvedValue(mockStaff),
            preload: jest.fn().mockResolvedValue(mockStaff),
            find: jest.fn().mockResolvedValue([mockStaff]),
            query: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: StaffQueriesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockStaff]),
            findAllWithRoleSpecific: jest.fn().mockResolvedValue({
              staffs: [mockStaff],
              meta: { total: 1 },
            }),
            findAllTechnicalByIds: jest.fn().mockResolvedValue([mockStaff]),
            findAllTechnical: jest.fn().mockResolvedValue([mockStaff]),
            findAllTechnical2: jest.fn().mockResolvedValue([mockStaff]),
            findAllCoordinators: jest.fn().mockResolvedValue([mockStaff]),
            findAllDepartmentManagers: jest.fn().mockResolvedValue([mockStaff]),
            findAllBossCCContact: jest.fn().mockResolvedValue([mockStaff]),
            findAllUserForNotification: jest
              .fn()
              .mockResolvedValue([mockStaff]),
            findAllPlaningBossContact: jest.fn().mockResolvedValue([mockStaff]),
            getTechniciansResolutionKpi: jest.fn().mockResolvedValue({
              staffs: [mockStaff],
              meta: { total: 1 },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
    staffRepository = module.get(getRepositoryToken(Staff));
    staffQueriesService = module.get(StaffQueriesService);

    jest.clearAllMocks();
    service['logger'].error = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y guardar un nuevo miembro de staff', async () => {
      const createDto: CreateStaffDto = {
        name: 'Carlos',
        paternalSurname: 'López',
        maternalSurname: 'García',
        num_control: 'TECH001',
        rfc: 'LOGC900101XYZ',
      };

      const result = await service.create(createDto);
      expect(staffRepository.create).toHaveBeenCalledWith(createDto);
      expect(staffRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockStaff);
    });

    it('debe manejar error de duplicado (23505) lanzando BadRequestException', async () => {
      staffRepository.save.mockRejectedValueOnce({
        code: '23505',
        detail: 'Key (rfc) already exists.',
      });

      await expect(service.create({} as CreateStaffDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar el staff si existe', async () => {
      const result = await service.findOne('staff-uuid-1');
      expect(staffRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'staff-uuid-1' },
      });
      expect(result).toEqual(mockStaff);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      staffRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar los datos del staff', async () => {
      const updateDto: UpdateStaffDto = {
        name: 'Carlos Modificado',
      };

      const result = await service.update('staff-uuid-1', updateDto);
      expect(staffRepository.preload).toHaveBeenCalledWith(updateDto);
      expect(staffRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockStaff);
    });

    it('debe lanzar NotFoundException si el staff no existe al actualizar', async () => {
      staffRepository.preload.mockResolvedValueOnce(null);
      await expect(service.update('invalid-uuid', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteAllStaffs', () => {
    it('debe truncar tablas de staff y user', async () => {
      const result = await service.deleteAllStaffs();
      expect(staffRepository.query).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('syncSearchFields', () => {
    it('debe normalizar y actualizar los searchField de los registros', async () => {
      staffRepository.find.mockResolvedValueOnce([
        {
          id: 'staff-uuid-1',
          name: 'Óscar',
          paternalSurname: 'López',
          maternalSurname: 'Álvarez',
          num_control: 'TECH001',
        } as Staff,
      ]);

      const result = await service.syncSearchFields();
      expect(staffRepository.save).toHaveBeenCalled();
      expect(result.updatedRecords).toBe(1);
    });
  });

  describe('Delegated query methods', () => {
    it('debe delegar findAll a StaffQueriesService', async () => {
      await service.findAll();
      expect(staffQueriesService.findAll).toHaveBeenCalled();
    });

    it('debe delegar findAllWithRoleSpecific a StaffQueriesService', async () => {
      await service.findAllWithRoleSpecific({ limit: 10, offset: 0 });
      expect(staffQueriesService.findAllWithRoleSpecific).toHaveBeenCalled();
    });

    it('debe delegar findAllTechnicalByIds a StaffQueriesService', async () => {
      await service.findAllTechnicalByIds(['id-1']);
      expect(staffQueriesService.findAllTechnicalByIds).toHaveBeenCalledWith([
        'id-1',
      ]);
    });

    it('debe delegar findAllTechnical a StaffQueriesService', async () => {
      await service.findAllTechnical();
      expect(staffQueriesService.findAllTechnical).toHaveBeenCalled();
    });

    it('debe delegar findAllTechnical2 a StaffQueriesService', async () => {
      await service.findAllTechnical2();
      expect(staffQueriesService.findAllTechnical2).toHaveBeenCalled();
    });

    it('debe delegar findAllCoordinators a StaffQueriesService', async () => {
      await service.findAllCoordinators();
      expect(staffQueriesService.findAllCoordinators).toHaveBeenCalled();
    });

    it('debe delegar findAllDepartmentManagers a StaffQueriesService', async () => {
      await service.findAllDepartmentManagers();
      expect(staffQueriesService.findAllDepartmentManagers).toHaveBeenCalled();
    });

    it('debe delegar findAllBossCCContact a StaffQueriesService', async () => {
      await service.findAllBossCCContact();
      expect(staffQueriesService.findAllBossCCContact).toHaveBeenCalled();
    });

    it('debe delegar findAllUserForNotification a StaffQueriesService', async () => {
      await service.findAllUserForNotification();
      expect(staffQueriesService.findAllUserForNotification).toHaveBeenCalled();
    });

    it('debe delegar findAllPlaningBossContact a StaffQueriesService', async () => {
      await service.findAllPlaningBossContact();
      expect(staffQueriesService.findAllPlaningBossContact).toHaveBeenCalled();
    });

    it('debe delegar getTechniciansResolutionKpi a StaffQueriesService', async () => {
      await service.getTechniciansResolutionKpi({ limit: 10, offset: 0 });
      expect(
        staffQueriesService.getTechniciansResolutionKpi,
      ).toHaveBeenCalled();
    });
  });

  describe('handleDBExceptions unhandled errors', () => {
    it('debe lanzar InternalServerErrorException en otros errores', () => {
      expect(() => service['handleDBExceptions'](new Error('Unknown'))).toThrow(
        InternalServerErrorException,
      );
    });
  });
});
