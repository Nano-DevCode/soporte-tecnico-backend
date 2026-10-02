import { Test, TestingModule } from '@nestjs/testing';
import { ConsumablesService } from './consumables.service';
import { ConsumablesCrudService } from './services/consumables-crud.service';
import { Consumable } from './entities/consumable.entity';
import { CreateConsumableDto } from './dto/create-consumable.dto';
import { UpdateConsumableDto } from './dto/update-consumable.dto';
import { FilterConsumableDto } from './dto/filter-consumable.dto';

describe('ConsumablesService', () => {
  let service: ConsumablesService;

  const mockCrudService = {
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumablesService,
        {
          provide: ConsumablesCrudService,
          useValue: mockCrudService,
        },
      ],
    }).compile();

    service = module.get<ConsumablesService>(ConsumablesService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('create debe delegar a crudService.create', async () => {
    const dto: CreateConsumableDto = {
      name: 'Item',
      description: 'Desc',
      id_brand_consumable: 'b-1',
      id_type_consumable: 1,
      id_ubication_consumable: 'u-1',
      id_unit_measurement: 1,
      stockMin: 1,
      stockMax: 10,
    };
    const expected = { id: 'c-1', ...dto } as unknown as Consumable;
    mockCrudService.create.mockResolvedValue(expected);

    const result = await service.create(dto);

    expect(mockCrudService.create).toHaveBeenCalledWith(dto, undefined);
    expect(result).toEqual(expected);
  });

  it('update debe delegar a crudService.update', async () => {
    const dto: UpdateConsumableDto = { name: 'Item modificado' };
    const expected = { id: 'c-1', ...dto } as unknown as Consumable;
    mockCrudService.update.mockResolvedValue(expected);

    const result = await service.update('c-1', dto);

    expect(mockCrudService.update).toHaveBeenCalledWith('c-1', dto, undefined);
    expect(result).toEqual(expected);
  });

  it('findAll debe delegar a crudService.findAll', async () => {
    const filterDto: FilterConsumableDto = { limit: 10, offset: 0 };
    const expected = {
      consumables: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    };
    mockCrudService.findAll.mockResolvedValue(expected);

    const result = await service.findAll(filterDto);

    expect(mockCrudService.findAll).toHaveBeenCalledWith(filterDto);
    expect(result).toEqual(expected);
  });

  it('findOne debe delegar a crudService.findOne', async () => {
    const expected = { id: 'c-1' } as unknown as Consumable;
    mockCrudService.findOne.mockResolvedValue(expected);

    const result = await service.findOne('c-1');

    expect(mockCrudService.findOne).toHaveBeenCalledWith('c-1');
    expect(result).toEqual(expected);
  });

  it('remove debe delegar a crudService.remove', async () => {
    const expected = { id: 'c-1', deleted: true };
    mockCrudService.remove.mockResolvedValue(expected);

    const result = await service.remove('c-1');

    expect(mockCrudService.remove).toHaveBeenCalledWith('c-1');
    expect(result).toEqual(expected);
  });
});
