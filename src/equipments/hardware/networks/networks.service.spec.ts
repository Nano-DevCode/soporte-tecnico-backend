import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { NetworksService } from './networks.service';
import { Network } from './entities/network.entity';
import { CreateNetworkDto } from './dto/create-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';

describe('NetworksService', () => {
  let service: NetworksService;

  const mockNetwork = {
    id: 'a4b81b4f-96c2-4d11-8231-1823746de825',
    number_ports: 24,
    PoE: true,
  } as Network;

  const mockRepo = {
    findOne: jest.fn(),
  };

  const mockManager = {
    create: jest.fn((entity, data) => data),
    save: jest.fn((entity) =>
      Promise.resolve({ id: mockNetwork.id, ...entity }),
    ),
    preload: jest.fn(),
  } as unknown as EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworksService,
        { provide: getRepositoryToken(Network), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NetworksService>(NetworksService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('createWithTransaction debe guardar el equipo de red', async () => {
    const dto: CreateNetworkDto = {
      id_type_equipment_network: 1,
      number_ports: 24,
      PoE: true,
    };

    const result = await service.createWithTransaction(
      mockManager,
      dto,
      'eq-1',
    );
    expect(mockManager.create).toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalled();
    expect(result.number_ports).toBe(24);
  });

  it('updateWithTransaction debe precargar y guardar', async () => {
    (mockManager.preload as jest.Mock).mockResolvedValue({
      ...mockNetwork,
      number_ports: 48,
    });

    const dto: UpdateNetworkDto = { number_ports: 48 };
    const result = await service.updateWithTransaction(
      mockManager,
      mockNetwork.id,
      dto,
    );

    expect(mockManager.preload).toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalled();
    expect(result?.number_ports).toBe(48);
  });
});
