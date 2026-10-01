import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DepartmentsService } from './departments.service';
import { Department } from '../entities/department.entity';
import { AppCacheService } from 'src/common/services/app-cache.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';

describe('DepartmentsService (Reactive Cache & Events)', () => {
  let service: DepartmentsService;
  let mockDepartmentRepo: Record<string, jest.Mock>;
  let mockCacheService: Record<string, jest.Mock>;
  let mockEventEmitter: Record<string, jest.Mock>;
  let mockI18nService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockDepartmentRepo = {
      find: jest.fn().mockResolvedValue([{ id: '1', name: 'Sistemas' }]),
      findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Sistemas' }),
      create: jest.fn((dto) => ({ id: 'new-id', ...dto })),
      save: jest.fn((d) => Promise.resolve(d)),
      preload: jest.fn((d) => Promise.resolve(d)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      remove: jest.fn((d) => Promise.resolve(d)),
      deleteAll: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(() => ({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: '1' }], 1]),
      })),
    };

    mockCacheService = {
      wrap: jest.fn((key, fn) => fn()),
      delByPattern: jest.fn().mockResolvedValue(2),
      generateKey: jest.fn((p) => `${p}:hash`),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockI18nService = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: getRepositoryToken(Department),
          useValue: mockDepartmentRepo,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
        {
          provide: AppCacheService,
          useValue: mockCacheService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll caching', () => {
    it('should call cacheService.wrap with catalog:departments:all', async () => {
      const res = await service.findAll();
      expect(mockCacheService.wrap).toHaveBeenCalledWith(
        'catalog:departments:all',
        expect.any(Function),
        600,
      );
      expect(res).toEqual([{ id: '1', name: 'Sistemas' }]);
    });
  });

  describe('findAllFilter caching', () => {
    it('should call cacheService.wrap with generated key', async () => {
      const res = await service.findAllFilter({ limit: 5, offset: 0 });
      expect(mockCacheService.generateKey).toHaveBeenCalledWith(
        'catalog:departments:filter',
        { limit: 5, offset: 0 },
      );
      expect(mockCacheService.wrap).toHaveBeenCalledWith(
        'catalog:departments:filter:hash',
        expect.any(Function),
        300,
      );
      expect(res.data).toEqual([{ id: '1' }]);
    });
  });

  describe('mutations and reactive invalidation', () => {
    it('create should invalidate cache and emit department.created', async () => {
      const created = await service.create({
        name: 'Recursos Humanos',
        acronym: 'RH',
      } as unknown as CreateDepartmentDto);

      expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
        'catalog:departments:*',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'department.created',
        created,
      );
    });

    it('update should invalidate cache and emit department.updated', async () => {
      await service.update('1', { name: 'Sistemas Nuevos' });

      expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
        'catalog:departments:*',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('department.updated', {
        id: '1',
        name: 'Sistemas Nuevos',
      });
    });

    it('changeStatus should invalidate cache and emit department.statusChanged', async () => {
      await service.changeStatus('1', { status: false });

      expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
        'catalog:departments:*',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'department.statusChanged',
        { id: '1', status: false },
      );
    });

    it('remove should invalidate cache and emit department.removed', async () => {
      await service.remove('1');

      expect(mockCacheService.delByPattern).toHaveBeenCalledWith(
        'catalog:departments:*',
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('department.removed', {
        id: '1',
      });
    });
  });
});
