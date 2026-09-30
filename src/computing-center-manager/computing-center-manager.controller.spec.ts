import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { ComputingCenterManagerController } from './computing-center-manager.controller';
import { ComputingCenterManagerService } from './computing-center-manager.service';
import { CreateComputingCenterManagerDto } from './dto/create-computing-center-manager.dto';
import { UpdateComputingCenterManagerDto } from './dto/update-computing-center-manager.dto';
import { FilterComputingCenterManagerDto } from './dto/filter-computing-center-managers.dto';
import { ComputingCenterManager } from './entities/computing-center-manager.entity';

describe('ComputingCenterManagerController', () => {
  let controller: ComputingCenterManagerController;
  let service: ComputingCenterManagerService;

  const mockComputingCenterManagerService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    activateManager: jest.fn(),
    deactivateManager: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComputingCenterManagerController],
      providers: [
        {
          provide: ComputingCenterManagerService,
          useValue: mockComputingCenterManagerService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<ComputingCenterManagerController>(
      ComputingCenterManagerController,
    );
    service = module.get<ComputingCenterManagerService>(
      ComputingCenterManagerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería llamar al servicio para crear un manager', async () => {
      const createDto: CreateComputingCenterManagerDto = {
        names: 'Juan',
        first_last_name: 'Perez',
        second_last_name: 'Gomez',
        rfc: 'PEGJ900101XYZ',
      };
      const expectedResult = {
        id: 'uuid-1',
        ...createDto,
      } as ComputingCenterManager;

      mockComputingCenterManagerService.create.mockResolvedValue(
        expectedResult,
      );

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
        search: 'Juan',
      } as FilterComputingCenterManagerDto;

      const expectedResult = {
        data: [{ id: 'uuid-1', names: 'Juan' }],
        meta: { total: 1, page: 1, lastPage: 1 },
      };

      mockComputingCenterManagerService.findAll.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findAll(filterDto);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findOne', () => {
    it('debería llamar al servicio para obtener un manager por ID', async () => {
      const expectedResult = {
        id: 'uuid-1',
        names: 'Juan',
      } as ComputingCenterManager;

      mockComputingCenterManagerService.findOne.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findOne('uuid-1');

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('update', () => {
    it('debería llamar al servicio para actualizar un manager', async () => {
      const updateDto = {
        names: 'Pedro',
      } as UpdateComputingCenterManagerDto;

      const expectedResult = {
        id: 'uuid-1',
        names: 'Pedro',
      } as ComputingCenterManager;

      mockComputingCenterManagerService.update.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.update('uuid-1', updateDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith('uuid-1', updateDto);
    });
  });

  describe('activate', () => {
    it('debería llamar al servicio para activar un manager', async () => {
      const expectedResult = {
        id: 'uuid-1',
        is_active: true,
      } as ComputingCenterManager;

      mockComputingCenterManagerService.activateManager.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.activate('uuid-1');

      expect(result).toEqual(expectedResult);
      expect(service.activateManager).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('deactivate', () => {
    it('debería llamar al servicio para desactivar un manager', async () => {
      const expectedResult = {
        id: 'uuid-1',
        is_active: false,
      } as ComputingCenterManager;

      mockComputingCenterManagerService.deactivateManager.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.deactivate('uuid-1');

      expect(result).toEqual(expectedResult);
      expect(service.deactivateManager).toHaveBeenCalledWith('uuid-1');
    });
  });
});
