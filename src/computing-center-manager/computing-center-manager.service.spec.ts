import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { ComputingCenterManagerService } from './computing-center-manager.service';
import { ComputingCenterManager } from './entities/computing-center-manager.entity';
import { CreateComputingCenterManagerDto } from './dto/create-computing-center-manager.dto';
import { UpdateComputingCenterManagerDto } from './dto/update-computing-center-manager.dto';
import { FilterComputingCenterManagerDto } from './dto/filter-computing-center-managers.dto';

describe('ComputingCenterManagerService', () => {
  let service: ComputingCenterManagerService;

  const mockComputingCenterManagerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    merge: jest.fn(),
    manager: {
      findOne: jest.fn(),
    },
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComputingCenterManagerService,
        {
          provide: getRepositoryToken(ComputingCenterManager),
          useValue: mockComputingCenterManagerRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<ComputingCenterManagerService>(
      ComputingCenterManagerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debería crear y guardar un manager', async () => {
      const createDto: CreateComputingCenterManagerDto = {
        names: 'Juan',
        first_last_name: 'Perez',
        second_last_name: 'Gomez',
        rfc: 'PEGJ900101XYZ',
      };
      const expectedManager = {
        id: 'uuid-1',
        ...createDto,
      } as ComputingCenterManager;

      mockComputingCenterManagerRepository.create.mockReturnValue(
        expectedManager,
      );
      mockComputingCenterManagerRepository.save.mockResolvedValue(
        expectedManager,
      );

      const result = await service.create(createDto);

      expect(result).toEqual(expectedManager);
      expect(mockComputingCenterManagerRepository.create).toHaveBeenCalledWith(
        createDto,
      );
      expect(mockComputingCenterManagerRepository.save).toHaveBeenCalledWith(
        expectedManager,
      );
    });

    it('debería lanzar ConflictException si el registro está duplicado (23505)', async () => {
      const createDto = {} as CreateComputingCenterManagerDto;

      const queryError = new QueryFailedError('query', [], new Error());
      Object.assign(queryError, { driverError: { code: '23505' } });

      mockComputingCenterManagerRepository.create.mockReturnValue(createDto);
      mockComputingCenterManagerRepository.save.mockRejectedValue(queryError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.manager.duplicate',
      );
    });

    it('debería relanzar el error si no es un error de duplicado controlado', async () => {
      const createDto = {} as CreateComputingCenterManagerDto;
      const unhandledError = new Error('Error Inesperado');

      mockComputingCenterManagerRepository.create.mockReturnValue(createDto);
      mockComputingCenterManagerRepository.save.mockRejectedValue(
        unhandledError,
      );

      await expect(service.create(createDto)).rejects.toThrow(unhandledError);
    });
  });

  describe('findAll', () => {
    it('debería retornar datos paginados usando parámetros por defecto', async () => {
      const filterDto = {} as FilterComputingCenterManagerDto;
      const manager = {
        id: 'uuid-1',
        names: 'Juan',
      } as ComputingCenterManager;

      mockComputingCenterManagerRepository.findAndCount.mockResolvedValue([
        [manager],
        1,
      ]);

      const result = await service.findAll(filterDto);

      expect(result.data).toEqual([manager]);
      expect(result.meta.total).toBe(1);
      expect(
        mockComputingCenterManagerRepository.findAndCount,
      ).toHaveBeenCalled();
    });

    it('debería incluir cláusulas ILike cuando se envía el parámetro search', async () => {
      const filterDto = {
        search: 'Juan',
        is_active: true,
      } as FilterComputingCenterManagerDto;
      mockComputingCenterManagerRepository.findAndCount.mockResolvedValue([
        [],
        0,
      ]);

      await service.findAll(filterDto);

      const calls = mockComputingCenterManagerRepository.findAndCount.mock
        .calls as unknown[][];
      const callArguments = calls[0][0] as { where: unknown };

      expect(Array.isArray(callArguments.where)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('debería retornar el manager si existe', async () => {
      const manager = { id: 'uuid-1' } as ComputingCenterManager;
      mockComputingCenterManagerRepository.findOneBy.mockResolvedValue(manager);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(manager);
      expect(
        mockComputingCenterManagerRepository.findOneBy,
      ).toHaveBeenCalledWith({
        id: 'uuid-1',
      });
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockComputingCenterManagerRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('uuid-99')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('uuid-99')).rejects.toThrow(
        'errors.manager.not_found_id',
      );
    });
  });

  describe('update', () => {
    it('debería actualizar un manager existente', async () => {
      const existingManager = {
        id: 'uuid-1',
        names: 'Juan',
      } as ComputingCenterManager;
      const updateDto = { names: 'Pedro' } as UpdateComputingCenterManagerDto;
      const updatedManager = { ...existingManager, ...updateDto };

      mockComputingCenterManagerRepository.findOneBy.mockResolvedValue(
        existingManager,
      );
      mockComputingCenterManagerRepository.save.mockResolvedValue(
        updatedManager,
      );

      const result = await service.update('uuid-1', updateDto);

      expect(mockComputingCenterManagerRepository.merge).toHaveBeenCalledWith(
        existingManager,
        updateDto,
      );
      expect(mockComputingCenterManagerRepository.save).toHaveBeenCalledWith(
        existingManager,
      );
      expect(result).toEqual(updatedManager);
    });
  });

  describe('activateManager', () => {
    it('debería retornar el manager si ya está activo sin guardar en DB', async () => {
      const manager = {
        id: 'uuid-1',
        is_active: true,
      } as ComputingCenterManager;
      mockComputingCenterManagerRepository.findOneBy.mockResolvedValue(manager);

      const result = await service.activateManager('uuid-1');

      expect(result).toEqual(manager);
      expect(mockComputingCenterManagerRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar ConflictException si otro manager ya está activo', async () => {
      const manager = {
        id: 'uuid-1',
        is_active: false,
      } as ComputingCenterManager;
      const activeManager = {
        id: 'uuid-2',
        is_active: true,
        names: 'Pedro',
        first_last_name: 'Perez',
        second_last_name: 'Gomez',
      } as ComputingCenterManager;

      mockComputingCenterManagerRepository.findOneBy.mockResolvedValue(manager);
      mockComputingCenterManagerRepository.manager.findOne.mockResolvedValue(
        activeManager,
      );

      await expect(service.activateManager('uuid-1')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.activateManager('uuid-1')).rejects.toThrow(
        'errors.manager.already_active',
      );
    });

    it('debería activar y guardar el manager', async () => {
      const manager = {
        id: 'uuid-1',
        is_active: false,
      } as ComputingCenterManager;
      mockComputingCenterManagerRepository.findOneBy.mockResolvedValue(manager);
      mockComputingCenterManagerRepository.manager.findOne.mockResolvedValue(
        null,
      );
      mockComputingCenterManagerRepository.save.mockImplementation(
        <T>(m: T): Promise<T> => Promise.resolve(m),
      );

      const result = await service.activateManager('uuid-1');

      expect(result.is_active).toBe(true);
      expect(mockComputingCenterManagerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      );
    });
  });

  describe('deactivateManager', () => {
    it('debería retornar el manager sin guardar si ya está inactivo', async () => {
      const manager = {
        id: 'uuid-1',
        is_active: false,
      } as ComputingCenterManager;
      mockComputingCenterManagerRepository.findOneBy.mockResolvedValue(manager);

      const result = await service.deactivateManager('uuid-1');

      expect(result).toEqual(manager);
      expect(mockComputingCenterManagerRepository.save).not.toHaveBeenCalled();
    });

    it('debería desactivar y guardar el manager', async () => {
      const manager = {
        id: 'uuid-1',
        is_active: true,
      } as ComputingCenterManager;
      mockComputingCenterManagerRepository.findOneBy.mockResolvedValue(manager);
      mockComputingCenterManagerRepository.save.mockImplementation(
        <T>(m: T): Promise<T> => Promise.resolve(m),
      );

      const result = await service.deactivateManager('uuid-1');

      expect(result.is_active).toBe(false);
      expect(mockComputingCenterManagerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
    });
  });

  describe('getActiveManager', () => {
    it('debería retornar el manager activo', async () => {
      const manager = {
        id: 'uuid-1',
        is_active: true,
      } as ComputingCenterManager;
      mockComputingCenterManagerRepository.manager.findOne.mockResolvedValue(
        manager,
      );

      const result = await service.getActiveManager();

      expect(result).toEqual(manager);
      expect(
        mockComputingCenterManagerRepository.manager.findOne,
      ).toHaveBeenCalledWith(ComputingCenterManager, {
        where: { is_active: true },
      });
    });
  });

  describe('getActiveManagerOrFail', () => {
    it('debería retornar el manager activo', async () => {
      const manager = {
        id: 'uuid-1',
        is_active: true,
      } as ComputingCenterManager;
      mockComputingCenterManagerRepository.manager.findOne.mockResolvedValue(
        manager,
      );

      const result = await service.getActiveManagerOrFail();

      expect(result).toEqual(manager);
    });

    it('debería lanzar NotFoundException si no encuentra manager activo', async () => {
      mockComputingCenterManagerRepository.manager.findOne.mockResolvedValue(
        null,
      );

      await expect(service.getActiveManagerOrFail()).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getActiveManagerOrFail()).rejects.toThrow(
        'errors.manager.no_active_found',
      );
    });
  });
});
