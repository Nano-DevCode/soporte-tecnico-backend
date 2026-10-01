import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { DepartmentSeedService } from './department-seed.service';
import { DepartmentsService } from '../services/departments.service';
import { Department } from '../entities/department.entity';

describe('DepartmentSeedService', () => {
  let service: DepartmentSeedService;
  let mockDepartmentsService: {
    findAll: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    mockDepartmentsService = {
      findAll: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentSeedService,
        {
          provide: DepartmentsService,
          useValue: mockDepartmentsService,
        },
      ],
    }).compile();

    service = module.get<DepartmentSeedService>(DepartmentSeedService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException if more than 1 department exists', async () => {
    mockDepartmentsService.findAll.mockResolvedValue([
      { id: '1', name: 'Dirección', acronym: 'DIR' },
      { id: '2', name: 'Subdirección', acronym: 'SAC' },
    ] as Department[]);

    await expect(service.runSeed()).rejects.toThrow(ConflictException);
    expect(mockDepartmentsService.create).not.toHaveBeenCalled();
  });

  it('should run seed successfully if 0 departments exist', async () => {
    mockDepartmentsService.findAll.mockResolvedValue([]);

    const result = await service.runSeed();

    expect(result).toEqual({
      message: 'Seed de departamentos ejecutado correctamente',
    });
    expect(mockDepartmentsService.create).toHaveBeenCalled();
  });

  it('should run seed successfully if 1 department exists and skip existing', async () => {
    mockDepartmentsService.findAll.mockResolvedValue([
      { id: '1', name: 'Dirección', acronym: 'DIR' },
    ] as Department[]);

    const result = await service.runSeed();

    expect(result).toEqual({
      message: 'Seed de departamentos ejecutado correctamente',
    });
    expect(mockDepartmentsService.create).toHaveBeenCalled();
    // Verify that 'Dirección' was skipped
    const calls = mockDepartmentsService.create.mock.calls;
    const direccionCall = calls.find(
      (c) => c[0].name === 'Dirección' || c[0].acronym === 'DIR',
    );
    expect(direccionCall).toBeUndefined();
  });
});

