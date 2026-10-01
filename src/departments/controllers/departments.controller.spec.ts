import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from '../services/departments.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { FilterDepartmentDto } from '../dto/filter-department.dto';
import { ChangeDepartmentStatusDto } from '../dto/change-status.dto';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let service: DepartmentsService;

  const mockDepartment = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Sistemas y Computación',
    acronym: 'SC',
    priority: 1,
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDepartmentsService = {
    create: jest.fn(),
    findAllFilter: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    changeStatus: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        {
          provide: DepartmentsService,
          useValue: mockDepartmentsService,
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

    controller = module.get<DepartmentsController>(DepartmentsController);
    service = module.get<DepartmentsService>(DepartmentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a department', async () => {
      const dto: CreateDepartmentDto = {
        name: 'Sistemas y Computación',
        acronym: 'SC',
        priority: 1,
      };

      mockDepartmentsService.create.mockResolvedValue(mockDepartment);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('findAllFilter', () => {
    it('should return filtered departments with pagination', async () => {
      const filterDto: FilterDepartmentDto = {
        limit: 10,
        offset: 0,
        query: 'Sistemas',
      };
      const paginatedResult = {
        data: [mockDepartment],
        meta: { total: 1, page: 1, lastPage: 1 },
      };

      mockDepartmentsService.findAllFilter.mockResolvedValue(paginatedResult);

      const result = await controller.findAllFilter(filterDto);

      expect(service.findAllFilter).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findAll', () => {
    it('should return all departments', async () => {
      mockDepartmentsService.findAll.mockResolvedValue([mockDepartment]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockDepartment]);
    });
  });

  describe('findOne', () => {
    it('should return a department by id', async () => {
      mockDepartmentsService.findOne.mockResolvedValue(mockDepartment);

      const result = await controller.findOne(mockDepartment.id);

      expect(service.findOne).toHaveBeenCalledWith(mockDepartment.id);
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('changeStatus', () => {
    it('should change department status', async () => {
      const changeDto: ChangeDepartmentStatusDto = { status: false };
      const statusResult = { id: mockDepartment.id, status: false };

      mockDepartmentsService.changeStatus.mockResolvedValue(statusResult);

      const result = await controller.changeStatus(
        mockDepartment.id,
        changeDto,
      );

      expect(service.changeStatus).toHaveBeenCalledWith(
        mockDepartment.id,
        changeDto,
      );
      expect(result).toEqual(statusResult);
    });
  });

  describe('update', () => {
    it('should update a department', async () => {
      const updateDto: UpdateDepartmentDto = {
        name: 'Sistemas Actualizado',
      };
      const updatedDepartment = {
        ...mockDepartment,
        name: 'Sistemas Actualizado',
      };

      mockDepartmentsService.update.mockResolvedValue(updatedDepartment);

      const result = await controller.update(mockDepartment.id, updateDto);

      expect(service.update).toHaveBeenCalledWith(
        mockDepartment.id,
        updateDto,
      );
      expect(result).toEqual(updatedDepartment);
    });
  });

  describe('remove', () => {
    it('should remove a department', async () => {
      mockDepartmentsService.remove.mockResolvedValue(mockDepartment);

      const result = await controller.remove(mockDepartment.id);

      expect(service.remove).toHaveBeenCalledWith(mockDepartment.id);
      expect(result).toEqual(mockDepartment);
    });
  });
});

