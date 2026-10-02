import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { EquipmenttypesService } from './equipmenttypes.service';
import { Equipmenttype } from './entities/equipmenttype.entity';
import { CreateEquipmenttypeDto } from './dto/create-equipmenttype.dto';

describe('EquipmenttypesService', () => {
  let service: EquipmenttypesService;

  const mockType = {
    id: 1,
    name: 'Computadora',
    description: 'Equipo de cómputo',
  } as Equipmenttype;

  const mockRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((dto) => Promise.resolve({ id: 1, ...dto })),
    findAndCount: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmenttypesService,
        { provide: getRepositoryToken(Equipmenttype), useValue: mockRepo },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<EquipmenttypesService>(EquipmenttypesService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('create debe crear un tipo si el nombre es válido', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    const dto: CreateEquipmenttypeDto = {
      name: 'Computadora',
      description: 'Desc',
    };

    const result = await service.create(dto);
    expect(result.name).toBe('Computadora');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('create debe lanzar ConflictException si el tipo ya existe', async () => {
    mockRepo.findOne.mockResolvedValue(mockType);
    const dto: CreateEquipmenttypeDto = {
      name: 'Computadora',
      description: 'Desc',
    };

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });
});
