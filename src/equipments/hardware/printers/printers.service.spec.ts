import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { PrintersService } from './printers.service';
import { Printer } from './entities/printer.entity';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';

describe('PrintersService', () => {
  let service: PrintersService;

  const mockPrinter = {
    id: '3f2b81a4-96c2-4d11-8231-1823746de205',
    color: true,
    model_toner: 'HP 105A',
  } as Printer;

  const mockRepo = {
    findOne: jest.fn(),
  };

  const mockManager = {
    create: jest.fn((entity, data) => data),
    save: jest.fn((entity) =>
      Promise.resolve({ id: mockPrinter.id, ...entity }),
    ),
    preload: jest.fn(),
  } as unknown as EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrintersService,
        { provide: getRepositoryToken(Printer), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PrintersService>(PrintersService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('createWithTransaction debe guardar la impresora', async () => {
    const dto: CreatePrinterDto = {
      id_type_function: 1,
      id_type_printing: 1,
      color: true,
      model_toner: 'hp 105a',
    };

    const result = await service.createWithTransaction(
      mockManager,
      dto,
      'eq-1',
    );
    expect(mockManager.create).toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalled();
    expect(result.model_toner).toBe('HP 105A');
  });

  it('updateWithTransaction debe precargar y guardar', async () => {
    (mockManager.preload as jest.Mock).mockResolvedValue({
      ...mockPrinter,
      model_toner: 'CANON 051',
    });

    const dto: UpdatePrinterDto = { model_toner: 'canon 051' };
    const result = await service.updateWithTransaction(
      mockManager,
      mockPrinter.id,
      dto,
    );

    expect(mockManager.preload).toHaveBeenCalled();
    expect(mockManager.save).toHaveBeenCalled();
    expect(result.model_toner).toBe('CANON 051');
  });

  it('updateWithTransaction debe retornar undefined si no existe', async () => {
    (mockManager.preload as jest.Mock).mockResolvedValue(null);

    const result = await service.updateWithTransaction(
      mockManager,
      'non-existent',
      { model_toner: 'test' },
    );
    expect(result).toBeUndefined();
  });
});
