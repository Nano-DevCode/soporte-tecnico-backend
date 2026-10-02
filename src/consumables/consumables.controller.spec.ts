import { Test, TestingModule } from '@nestjs/testing';
import { ConsumablesController } from './consumables.controller';
import { ConsumablesService } from './consumables.service';
import { I18nService } from 'nestjs-i18n';
import { Consumable } from './entities/consumable.entity';
import { CreateConsumableDto } from './dto/create-consumable.dto';
import { UpdateConsumableDto } from './dto/update-consumable.dto';
import { FilterConsumableDto } from './dto/filter-consumable.dto';
import { MulterFile } from 'src/files/files.service';

describe('ConsumablesController', () => {
  let controller: ConsumablesController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsumablesController],
      providers: [
        {
          provide: ConsumablesService,
          useValue: mockService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<ConsumablesController>(ConsumablesController);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('create debe llamar a consumablesService.create', async () => {
    const dto: CreateConsumableDto = {
      name: 'Toner',
      description: 'Desc',
      id_brand_consumable: 'b-1',
      id_type_consumable: 1,
      id_ubication_consumable: 'u-1',
      id_unit_measurement: 1,
      stockMin: 1,
      stockMax: 10,
    };
    const file = { buffer: Buffer.from('') } as MulterFile;
    const expected = { id: 'c-1', ...dto } as unknown as Consumable;
    mockService.create.mockResolvedValue(expected);

    const result = await controller.create(dto, file);

    expect(mockService.create).toHaveBeenCalledWith(dto, file);
    expect(result).toEqual(expected);
  });

  it('findAll debe llamar a consumablesService.findAll', async () => {
    const filterDto: FilterConsumableDto = { limit: 10, offset: 0 };
    const expected = {
      consumables: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    };
    mockService.findAll.mockResolvedValue(expected);

    const result = await controller.findAll(filterDto);

    expect(mockService.findAll).toHaveBeenCalledWith(filterDto);
    expect(result).toEqual(expected);
  });

  it('findOne debe llamar a consumablesService.findOne', async () => {
    const expected = { id: 'c-1' } as unknown as Consumable;
    mockService.findOne.mockResolvedValue(expected);

    const result = await controller.findOne('c-1');

    expect(mockService.findOne).toHaveBeenCalledWith('c-1');
    expect(result).toEqual(expected);
  });

  it('update debe llamar a consumablesService.update', async () => {
    const dto: UpdateConsumableDto = { name: 'Toner updated' };
    const file = { buffer: Buffer.from('') } as MulterFile;
    const expected = { id: 'c-1', ...dto } as unknown as Consumable;
    mockService.update.mockResolvedValue(expected);

    const result = await controller.update('c-1', dto, file);

    expect(mockService.update).toHaveBeenCalledWith('c-1', dto, file);
    expect(result).toEqual(expected);
  });
});
