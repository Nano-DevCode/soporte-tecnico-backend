import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SchoolPeriodsService } from './school-periods.service';
import { PeriodType, SchoolPeriod } from './entities/school-period.entity';
import { CreateSchoolPeriodDto } from './dto/create-school-period.dto';
import { FilterSchoolPeriodDto } from './dto/filter-school-period.dto';

describe('SchoolPeriodsService', () => {
  let service: SchoolPeriodsService;

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  };

  const mockSchoolPeriodsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    manager: {
      findOneBy: jest.fn(),
    },
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolPeriodsService,
        {
          provide: getRepositoryToken(SchoolPeriod),
          useValue: mockSchoolPeriodsRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<SchoolPeriodsService>(SchoolPeriodsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear y retornar un periodo escolar exitosamente', async () => {
      const createDto: CreateSchoolPeriodDto = {
        period_type: PeriodType.ENERO_JUNIO,
        date_start: new Date('2026-01-01').toISOString() as unknown as Date,
        date_end: new Date('2026-06-30').toISOString() as unknown as Date,
      };

      const expectedPeriod = {
        ...createDto,
        id: 'uuid-1',
        name: '20261',
      } as unknown as SchoolPeriod;

      mockSchoolPeriodsRepository.create.mockReturnValue(expectedPeriod);
      mockSchoolPeriodsRepository.save.mockResolvedValue(expectedPeriod);

      const result = await service.create(createDto);

      expect(result).toEqual(expectedPeriod);
      expect(mockSchoolPeriodsRepository.create).toHaveBeenCalledWith(
        createDto,
      );
      expect(mockSchoolPeriodsRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException si date_end es antes que date_start', async () => {
      const createDto: CreateSchoolPeriodDto = {
        period_type: PeriodType.ENERO_JUNIO,
        date_start: new Date('2026-06-30').toISOString() as unknown as Date,
        date_end: new Date('2026-01-01').toISOString() as unknown as Date,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.school_periods.invalid_dates',
      );
    });

    it('debería lanzar ConflictException si el nombre ya existe', async () => {
      const createDto: CreateSchoolPeriodDto = {
        period_type: PeriodType.ENERO_JUNIO,
        date_start: new Date('2026-01-01').toISOString() as unknown as Date,
        date_end: new Date('2026-06-30').toISOString() as unknown as Date,
      };

      mockSchoolPeriodsRepository.create.mockReturnValue(createDto);
      mockSchoolPeriodsRepository.save.mockRejectedValue({ code: '23505' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.school_periods.name_already_exists',
      );
    });
  });

  describe('findOne', () => {
    it('debería retornar un periodo si existe', async () => {
      const period = { id: 'uuid-1', name: '20261' } as SchoolPeriod;
      mockSchoolPeriodsRepository.findOneBy.mockResolvedValue(period);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(period);
      expect(mockSchoolPeriodsRepository.findOneBy).toHaveBeenCalledWith({
        id: 'uuid-1',
      });
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockSchoolPeriodsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('uuid-99')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debería lanzar ConflictException si cambia el nombre y ya tiene tickets asociados', async () => {
      const existingPeriod = {
        id: 'uuid-1',
        name: '20251',
        date_start: new Date('2025-06-01T12:00:00Z'),
        period_type: PeriodType.ENERO_JUNIO,
      } as SchoolPeriod;

      mockSchoolPeriodsRepository.findOneBy.mockResolvedValue(existingPeriod);
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const updateDto = {
        date_start: new Date(
          '2026-06-01T12:00:00Z',
        ).toISOString() as unknown as Date,
      };

      const updatePromise = service.update('uuid-1', updateDto);

      await expect(updatePromise).rejects.toThrow(ConflictException);
      await expect(updatePromise).rejects.toThrow(
        'errors.school_periods.cannot_update_name_with_tickets',
      );
    });
  });

  describe('activateSchoolPeriod', () => {
    it('debería lanzar ConflictException si ya hay otro periodo activo', async () => {
      const currentPeriod = {
        id: 'uuid-1',
        is_active: false,
      } as SchoolPeriod;
      const activePeriod = {
        id: 'uuid-2',
        name: '20253',
        is_active: true,
      } as SchoolPeriod;

      mockSchoolPeriodsRepository.findOneBy.mockResolvedValue(currentPeriod);
      mockSchoolPeriodsRepository.manager.findOneBy.mockResolvedValue(
        activePeriod,
      );

      await expect(service.activateSchoolPeriod('uuid-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('debería retornar el mismo periodo sin guardar si ya estaba activo', async () => {
      const currentPeriod = {
        id: 'uuid-1',
        is_active: true,
      } as SchoolPeriod;

      mockSchoolPeriodsRepository.findOneBy.mockResolvedValue(currentPeriod);

      const result = await service.activateSchoolPeriod('uuid-1');

      expect(result).toEqual(currentPeriod);
      expect(mockSchoolPeriodsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debería retornar una lista paginada y aplicar filtros', async () => {
      const filterDto = {
        limit: 10,
        page: 1,
        search: '2026',
        is_active: true,
      } as FilterSchoolPeriodDto;

      const period = { id: 'uuid-1', name: '20261' } as SchoolPeriod;

      mockSchoolPeriodsRepository.findAndCount.mockResolvedValue([[period], 1]);

      const result = await service.findAll(filterDto);

      expect(result.data).toBeDefined();
      expect(mockSchoolPeriodsRepository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findAllForSelect', () => {
    it('debería retornar una lista con campos específicos', async () => {
      const period = { id: 'uuid-1', name: '20261' } as SchoolPeriod;
      mockSchoolPeriodsRepository.find.mockResolvedValue([period]);

      const result = await service.findAllForSelect();

      expect(result).toEqual([period]);
      expect(mockSchoolPeriodsRepository.find).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debería eliminar y retornar el periodo', async () => {
      const period = { id: 'uuid-1', name: '20261' } as SchoolPeriod;

      mockSchoolPeriodsRepository.findOneBy.mockResolvedValue(period);
      mockSchoolPeriodsRepository.remove.mockResolvedValue(period);

      const result = await service.remove('uuid-1');

      expect(result).toEqual(period);
      expect(mockSchoolPeriodsRepository.remove).toHaveBeenCalledWith(period);
    });
  });

  describe('deactivateSchoolPeriod', () => {
    it('debería desactivar el periodo y guardarlo si estaba activo', async () => {
      const period = { id: 'uuid-1', is_active: true } as SchoolPeriod;
      const savedPeriod = { ...period, is_active: false } as SchoolPeriod;

      mockSchoolPeriodsRepository.findOneBy.mockResolvedValue(period);
      mockSchoolPeriodsRepository.save.mockResolvedValue(savedPeriod);

      const result = await service.deactivateSchoolPeriod('uuid-1');

      expect(result.is_active).toBe(false);
      expect(mockSchoolPeriodsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });

    it('debería retornar el periodo sin guardar si ya estaba inactivo', async () => {
      const period = { id: 'uuid-1', is_active: false } as SchoolPeriod;

      mockSchoolPeriodsRepository.findOneBy.mockResolvedValue(period);

      const result = await service.deactivateSchoolPeriod('uuid-1');

      expect(result).toEqual(period);
      expect(mockSchoolPeriodsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getActiveSchoolPeriodOrFail', () => {
    it('debería retornar el periodo activo si existe', async () => {
      const period = { id: 'uuid-1', is_active: true } as SchoolPeriod;

      mockSchoolPeriodsRepository.manager.findOneBy.mockResolvedValue(period);

      const result = await service.getActiveSchoolPeriodOrFail();

      expect(result).toEqual(period);
    });

    it('debería lanzar NotFoundException si no hay periodo activo', async () => {
      mockSchoolPeriodsRepository.manager.findOneBy.mockResolvedValue(null);

      await expect(service.getActiveSchoolPeriodOrFail()).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
