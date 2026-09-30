import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { SchoolPeriodsController } from './school-periods.controller';
import { SchoolPeriodsService } from './school-periods.service';
import { CreateSchoolPeriodDto } from './dto/create-school-period.dto';
import { UpdateSchoolPeriodDto } from './dto/update-school-period.dto';
import { FilterSchoolPeriodDto } from './dto/filter-school-period.dto';
import { PeriodType, SchoolPeriod } from './entities/school-period.entity';

describe('SchoolPeriodsController', () => {
  let controller: SchoolPeriodsController;
  let service: SchoolPeriodsService;

  const mockSchoolPeriodsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllForSelect: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    activateSchoolPeriod: jest.fn(),
    deactivateSchoolPeriod: jest.fn(),
    remove: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolPeriodsController],
      providers: [
        {
          provide: SchoolPeriodsService,
          useValue: mockSchoolPeriodsService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<SchoolPeriodsController>(SchoolPeriodsController);
    service = module.get<SchoolPeriodsService>(SchoolPeriodsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería llamar al servicio para crear un periodo escolar', async () => {
      const createDto: CreateSchoolPeriodDto = {
        period_type: PeriodType.ENERO_JUNIO,
        date_start: new Date(
          '2026-01-01T12:00:00Z',
        ).toISOString() as unknown as Date,
        date_end: new Date(
          '2026-06-30T12:00:00Z',
        ).toISOString() as unknown as Date,
      };
      const expectedResult = {
        id: 'uuid-1',
        ...createDto,
      } as unknown as SchoolPeriod;

      mockSchoolPeriodsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('debería llamar al servicio para obtener una lista paginada', async () => {
      const filterDto = {
        limit: 10,
        page: 1,
        is_active: true,
      } as FilterSchoolPeriodDto;

      const expectedResult = {
        data: [{ id: 'uuid-1', name: '20261' }],
        meta: { total: 1, page: 1, lastPage: 1 },
      };

      mockSchoolPeriodsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findAllForSelect', () => {
    it('debería llamar al servicio para obtener la lista para el select', async () => {
      const expectedResult = [
        { id: 'uuid-1', name: '20261' },
      ] as SchoolPeriod[];

      mockSchoolPeriodsService.findAllForSelect.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findAllForSelect();

      expect(result).toEqual(expectedResult);
      expect(service.findAllForSelect).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería llamar al servicio para obtener un periodo por ID', async () => {
      const expectedResult = { id: 'uuid-1', name: '20261' } as SchoolPeriod;

      mockSchoolPeriodsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('uuid-1');

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('update', () => {
    it('debería llamar al servicio para actualizar un periodo', async () => {
      const updateDto = {
        is_active: true,
      } as UpdateSchoolPeriodDto;

      const expectedResult = { id: 'uuid-1', is_active: true } as SchoolPeriod;

      mockSchoolPeriodsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('uuid-1', updateDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith('uuid-1', updateDto);
    });
  });

  describe('activate', () => {
    it('debería llamar al servicio para activar un periodo', async () => {
      const expectedResult = { id: 'uuid-1', is_active: true } as SchoolPeriod;

      mockSchoolPeriodsService.activateSchoolPeriod.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.activate('uuid-1');

      expect(result).toEqual(expectedResult);
      expect(service.activateSchoolPeriod).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('deactivate', () => {
    it('debería llamar al servicio para desactivar un periodo', async () => {
      const expectedResult = { id: 'uuid-1', is_active: false } as SchoolPeriod;

      mockSchoolPeriodsService.deactivateSchoolPeriod.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.deactivate('uuid-1');

      expect(result).toEqual(expectedResult);
      expect(service.deactivateSchoolPeriod).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('remove', () => {
    it('debería llamar al servicio para eliminar un periodo', async () => {
      const expectedResult = { id: 'uuid-1', name: '20261' } as SchoolPeriod;

      mockSchoolPeriodsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove('uuid-1');

      expect(result).toEqual(expectedResult);
      expect(service.remove).toHaveBeenCalledWith('uuid-1');
    });
  });
});
