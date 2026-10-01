import { Test, TestingModule } from '@nestjs/testing';
import { StaffController } from './staff.controller';
import { StaffService } from '../services/staff.service';
import { TechnicianKpiService } from '../services/technician-kpi.service';
import { CreateStaffDto } from '../dto/staff/create-staff.dto';
import { UpdateStaffDto } from '../dto/staff/update-staff.dto';
import { FilterStaffDto } from '../dto/staff/filter-staff.dto';
import { FilterKpiDto } from '../dto/staff/filter-kpi.dto';
import { Staff } from '../entities/staff.entity';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

describe('StaffController', () => {
  let controller: StaffController;
  let staffService: jest.Mocked<StaffService>;
  let technicianKpiService: jest.Mocked<TechnicianKpiService>;

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
      controllers: [StaffController],
      providers: [
        {
          provide: StaffService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockStaff),
            findAllTechnical2: jest.fn().mockResolvedValue([mockStaff]),
            findAllCoordinators: jest.fn().mockResolvedValue([mockStaff]),
            findAllDepartmentManagers: jest.fn().mockResolvedValue([mockStaff]),
            findAllWithRoleSpecific: jest.fn().mockResolvedValue({
              staffs: [mockStaff],
              meta: { total: 1, limit: 10, offset: 0, totalPages: 1 },
            }),
            findAll: jest.fn().mockResolvedValue([mockStaff]),
            getTechniciansResolutionKpi: jest.fn().mockResolvedValue({
              staffs: [mockStaff],
              meta: { total: 1, page: 1, lastPage: 1 },
            }),
            syncSearchFields: jest.fn().mockResolvedValue({
              message:
                'Sincronización de campos de búsqueda completada con éxito',
              updatedRecords: 1,
            }),
            findOne: jest.fn().mockResolvedValue(mockStaff),
            update: jest.fn().mockResolvedValue(mockStaff),
          },
        },
        {
          provide: TechnicianKpiService,
          useValue: {
            getTechniciansResolutionKpi: jest.fn().mockResolvedValue({
              staffs: [mockStaff],
              meta: { total: 1, page: 1, lastPage: 1 },
            }),
            triggerKpiCalculation: jest.fn().mockResolvedValue(undefined),
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

    controller = module.get<StaffController>(StaffController);
    staffService = module.get(StaffService);
    technicianKpiService = module.get(TechnicianKpiService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe llamar a staffService.create', async () => {
      const dto: CreateStaffDto = {
        name: 'Carlos',
        paternalSurname: 'López',
        maternalSurname: 'García',
        num_control: 'TECH001',
        rfc: 'LOGC900101XYZ',
      };
      const result = await controller.create(dto);
      expect(staffService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockStaff);
    });
  });

  describe('findAllTechnical', () => {
    it('debe llamar a staffService.findAllTechnical2', async () => {
      const result = await controller.findAllTechnical();
      expect(staffService.findAllTechnical2).toHaveBeenCalled();
      expect(result).toEqual([mockStaff]);
    });
  });

  describe('findAllCoordinators', () => {
    it('debe llamar a staffService.findAllCoordinators', async () => {
      const result = await controller.findAllCoordinators();
      expect(staffService.findAllCoordinators).toHaveBeenCalled();
      expect(result).toEqual([mockStaff]);
    });
  });

  describe('findAllDepartmentManagers', () => {
    it('debe llamar a staffService.findAllDepartmentManagers', async () => {
      const result = await controller.findAllDepartmentManagers();
      expect(staffService.findAllDepartmentManagers).toHaveBeenCalled();
      expect(result).toEqual([mockStaff]);
    });
  });

  describe('findAllWithRoleSpecific', () => {
    it('debe llamar a staffService.findAllWithRoleSpecific', async () => {
      const filterDto: FilterStaffDto = { limit: 10, offset: 0 };
      const result = await controller.findAllWithRoleSpecific(filterDto);
      expect(staffService.findAllWithRoleSpecific).toHaveBeenCalledWith(
        filterDto,
      );
      expect(result.staffs).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('debe llamar a staffService.findAll', async () => {
      const result = await controller.findAll();
      expect(staffService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockStaff]);
    });
  });

  describe('getTechniciansResolution', () => {
    it('debe llamar a staffService.getTechniciansResolutionKpi', async () => {
      const filterDto: FilterStaffDto = { limit: 10, offset: 0 };
      const result = await controller.getTechniciansResolution(filterDto);
      expect(staffService.getTechniciansResolutionKpi).toHaveBeenCalledWith(
        filterDto,
      );
      expect(result.staffs).toHaveLength(1);
    });
  });

  describe('getTechniciansKpis', () => {
    it('debe llamar a technicianKpiService.getTechniciansResolutionKpi', async () => {
      const filterDto: FilterKpiDto = { limit: 10, offset: 0 };
      const result = await controller.getTechniciansKpis(filterDto);
      expect(
        technicianKpiService.getTechniciansResolutionKpi,
      ).toHaveBeenCalledWith(filterDto);
      expect(result.staffs).toHaveLength(1);
    });
  });

  describe('forceKpiNow', () => {
    it('debe llamar a technicianKpiService.triggerKpiCalculation', async () => {
      const result = await controller.forceKpiNow();
      expect(technicianKpiService.triggerKpiCalculation).toHaveBeenCalled();
      expect(result).toEqual({
        message:
          'Orden enviada a Redis. Revisa la consola de NestJS en tu terminal.',
      });
    });
  });

  describe('syncSearchFields', () => {
    it('debe llamar a staffService.syncSearchFields', async () => {
      const result = await controller.syncSearchFields();
      expect(staffService.syncSearchFields).toHaveBeenCalled();
      expect(result.updatedRecords).toBe(1);
    });
  });

  describe('findOne', () => {
    it('debe llamar a staffService.findOne', async () => {
      const result = await controller.findOne('staff-uuid-1');
      expect(staffService.findOne).toHaveBeenCalledWith('staff-uuid-1');
      expect(result).toEqual(mockStaff);
    });
  });

  describe('update', () => {
    it('debe llamar a staffService.update', async () => {
      const updateDto: UpdateStaffDto = { name: 'Carlos Nuevo' };
      const result = await controller.update('staff-uuid-1', updateDto);
      expect(staffService.update).toHaveBeenCalledWith(
        'staff-uuid-1',
        updateDto,
      );
      expect(result).toEqual(mockStaff);
    });
  });
});
