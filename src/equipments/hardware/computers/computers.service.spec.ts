import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ComputersService } from './computers.service';
import { Computer } from './entities/computer.entity';
import { CreateComputerDto } from './dto/create-computer.dto';
import { UpdateComputerDto } from './dto/update-computer.dto';

describe('ComputersService', () => {
  let service: ComputersService;

  const mockComputer = {
    id: '2b4e81a4-96c2-4d11-8231-1823746de301',
    ram: '16GB',
    capacity_storage: '512GB',
    available_storage: '256GB',
  } as Computer;

  const mockRepo = {
    findOne: jest.fn(),
  };

  const mockManager = {
    create: jest.fn((entity, data) => data),
    save: jest.fn((entity) =>
      Promise.resolve({ id: mockComputer.id, ...entity }),
    ),
    preload: jest.fn(),
  } as unknown as EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComputersService,
        { provide: getRepositoryToken(Computer), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ComputersService>(ComputersService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('createWithTransaction debe guardar la computadora en la transacción', async () => {
    const dto: CreateComputerDto = {
      ram: '16gb',
      capacity_storage: '512gb',
      available_storage: '256gb',
      id_processor: 1,
      id_type_operating_system: 1,
      id_type_storage: 1,
      id_type_equipment_computer: 1,
    };

    const result = await service.createWithTransaction(
      mockManager,
      dto,
      'eq-1',
    );
    expect(mockManager.create).toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalled();
    expect(result.ram).toBe('16GB');
  });

  it('updateWithTransaction debe precargar y guardar los cambios', async () => {
    (mockManager.preload as jest.Mock).mockResolvedValue({
      ...mockComputer,
      ram: '32GB',
    });

    const updateDto: UpdateComputerDto = { ram: '32gb' };
    const result = await service.updateWithTransaction(
      mockManager,
      mockComputer.id,
      updateDto,
    );

    expect(mockManager.preload).toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalled();
    expect(result.ram).toBe('32GB');
  });

  it('updateWithTransaction debe retornar undefined si no existe la computadora', async () => {
    (mockManager.preload as jest.Mock).mockResolvedValue(null);

    const result = await service.updateWithTransaction(
      mockManager,
      'non-existent',
      { ram: '32gb' },
    );
    expect(result).toBeUndefined();
  });
});
