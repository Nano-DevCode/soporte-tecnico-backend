import { Test, TestingModule } from '@nestjs/testing';
import { FaultValiditiesService } from './fault-validities.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FaultValidity } from './entities/fault-validity.entity';

describe('FaultValiditiesService', () => {
  let service: FaultValiditiesService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FaultValiditiesService,
        {
          provide: getRepositoryToken(FaultValidity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FaultValiditiesService>(FaultValiditiesService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y guardar una validez de falla', async () => {
      const dto = {
        name: 'Falla de Fabricación',
        description: 'Defecto en los componentes de fábrica',
        penalizes_equipment: true,
      };
      const entity = {
        id: 'uuid-1',
        ...dto,
        technical_reports: [],
      } as unknown as FaultValidity;

      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las opciones de validez de falla', async () => {
      const expected = [
        { id: '1', name: 'Validez 1', penalizes_equipment: false },
        { id: '2', name: 'Validez 2', penalizes_equipment: true },
      ] as unknown as FaultValidity[];
      mockRepo.find.mockResolvedValue(expected);

      const result = await service.findAll();

      expect(mockRepo.find).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('deleteAll', () => {
    it('debe truncar la tabla fault_validity', async () => {
      mockRepo.query.mockResolvedValue(undefined);

      await service.deleteAll();

      expect(mockRepo.query).toHaveBeenCalledWith(
        'TRUNCATE TABLE "fault_validity" RESTART IDENTITY CASCADE',
      );
    });
  });
});
