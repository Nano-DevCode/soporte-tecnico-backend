import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentsService } from './equipments.service';
import { EquipmentCrudService } from './services/equipment-crud.service';
import { EquipmentQueriesService } from './services/equipment-queries.service';
import { EquipmentStatusService } from './services/equipment-status.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { FilterEquipmentDto } from './dto/filter-equipment.dto';
import { Equipment } from './entities/equipment.entity';

describe('EquipmentsService (Facade)', () => {
  let service: EquipmentsService;

  const mockCrudService = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockQueriesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByType: jest.fn(),
    mapToDto: jest.fn(),
  };

  const mockStatusService = {
    activate: jest.fn(),
    deactivate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentsService,
        { provide: EquipmentCrudService, useValue: mockCrudService },
        { provide: EquipmentQueriesService, useValue: mockQueriesService },
        { provide: EquipmentStatusService, useValue: mockStatusService },
      ],
    }).compile();

    service = module.get<EquipmentsService>(EquipmentsService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('create debe delegar a crudService.create', async () => {
    const dto: CreateEquipmentDto = {
      num_inventario: 'INV-100',
      id_model: 'model-1',
      id_type_equipment: 1,
      status: true,
      description: 'Test PC',
    };
    const expected = { id: 'eq-1', ...dto } as unknown as Equipment;
    mockCrudService.create.mockResolvedValue(expected);

    const result = await service.create(dto);
    expect(mockCrudService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('findAll debe delegar a queriesService.findAll', async () => {
    const filterDto: FilterEquipmentDto = { limit: 10, offset: 0 };
    const expected = { data: [], meta: { total: 0, page: 1, lastPage: 1 } };
    mockQueriesService.findAll.mockResolvedValue(expected);

    const result = await service.findAll(filterDto);
    expect(mockQueriesService.findAll).toHaveBeenCalledWith(filterDto);
    expect(result).toEqual(expected);
  });

  it('findOne debe delegar a queriesService.findOne', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const expected = { id, num_inventario: 'INV-1' } as Equipment;
    mockQueriesService.findOne.mockResolvedValue(expected);

    const result = await service.findOne(id);
    expect(mockQueriesService.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('findByType debe delegar a queriesService.findByType', async () => {
    const filterDto: FilterEquipmentDto = { limit: 10, offset: 0 };
    const expected = { data: [], meta: { total: 0, page: 1, lastPage: 1 } };
    mockQueriesService.findByType.mockResolvedValue(expected);

    const result = await service.findByType(1, 'computers', filterDto);
    expect(mockQueriesService.findByType).toHaveBeenCalledWith(
      1,
      'computers',
      filterDto,
    );
    expect(result).toEqual(expected);
  });

  it('update debe delegar a crudService.update', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const dto: UpdateEquipmentDto = { description: 'Updated' };
    const expected = { id, ...dto };
    mockCrudService.update.mockResolvedValue(expected);

    const result = await service.update(id, dto);
    expect(mockCrudService.update).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(expected);
  });

  it('activate debe delegar a statusService.activate', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const expected = { id, status: true, updated: true };
    mockStatusService.activate.mockResolvedValue(expected);

    const result = await service.activate(id);
    expect(mockStatusService.activate).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('deactivate debe delegar a statusService.deactivate', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const expected = { id, status: false, updated: true };
    mockStatusService.deactivate.mockResolvedValue(expected);

    const result = await service.deactivate(id);
    expect(mockStatusService.deactivate).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('remove debe delegar a crudService.remove', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const expected = { id, deleted: true };
    mockCrudService.remove.mockResolvedValue(expected);

    const result = await service.remove(id);
    expect(mockCrudService.remove).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('mapToDto debe delegar a queriesService.mapToDto', () => {
    const eq = { id: 'eq-1' } as Equipment;
    const expected = { id: 'eq-1', folio: 'INV-1' };
    mockQueriesService.mapToDto.mockReturnValue(expected);

    const result = service.mapToDto(eq, 'all');
    expect(mockQueriesService.mapToDto).toHaveBeenCalledWith(eq, 'all');
    expect(result).toEqual(expected);
  });
});
