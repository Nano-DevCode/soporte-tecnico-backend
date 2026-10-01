import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CoordinationSeedService } from './coordination-seed.service';
import { CoordinationsService } from '../services/coordinations.service';
import { Coordination } from '../entities/coordination.entity';

describe('CoordinationSeedService', () => {
  let service: CoordinationSeedService;
  let coordinationsService: jest.Mocked<CoordinationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoordinationSeedService,
        {
          provide: CoordinationsService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CoordinationSeedService>(CoordinationSeedService);
    coordinationsService = module.get(CoordinationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runSeed', () => {
    it('debe ejecutar el seed si no hay más de 1 coordinación', async () => {
      coordinationsService.findAll.mockResolvedValue([]);
      coordinationsService.create.mockResolvedValue({} as Coordination);

      const result = await service.runSeed();

      expect(coordinationsService.findAll).toHaveBeenCalled();
      expect(coordinationsService.create).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Seed de coordinaciones ejecutado correctamente',
      });
    });

    it('debe lanzar ConflictException si el seed ya fue ejecutado', async () => {
      coordinationsService.findAll.mockResolvedValue([
        { id: '1' } as Coordination,
        { id: '2' } as Coordination,
      ]);

      await expect(service.runSeed()).rejects.toThrow(ConflictException);
    });
  });
});

