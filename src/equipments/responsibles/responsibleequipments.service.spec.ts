import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ResponsibleequipmentsService } from './responsibleequipments.service';
import { Responsibleequipment } from './entities/responsibleequipment.entity';
import { CreateResponsibleequipmentDto } from './dto/create-responsibleequipment.dto';

describe('ResponsibleequipmentsService', () => {
  let service: ResponsibleequipmentsService;

  const mockResponsible = {
    id: 'e3b07384-e223-4956-a5e2-bb51263c4599',
    num_employe: 'EMP-001',
    name: 'Juan',
    first_name: 'Pérez',
    last_name: 'Gómez',
    area: 'Sistemas',
    mail: 'juan@test.com',
  } as Responsibleequipment;

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn((dto) => dto),
    save: jest.fn((dto) => Promise.resolve({ id: mockResponsible.id, ...dto })),
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
        ResponsibleequipmentsService,
        {
          provide: getRepositoryToken(Responsibleequipment),
          useValue: mockRepo,
        },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<ResponsibleequipmentsService>(
      ResponsibleequipmentsService,
    );
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('create debe guardar un responsable si no está duplicado', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    const dto: CreateResponsibleequipmentDto = {
      num_employe: 'EMP-001',
      name: 'Juan',
      first_name: 'Pérez',
      last_name: 'Gómez',
      area: 'Sistemas',
      mail: 'juan@test.com',
    };

    const result = await service.create(dto);
    expect(result.num_employe).toBe('EMP-001');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('create debe lanzar ConflictException si el empleado o correo ya existe', async () => {
    mockRepo.findOne.mockResolvedValue(mockResponsible);
    const dto: CreateResponsibleequipmentDto = {
      num_employe: 'EMP-001',
      name: 'Juan',
      first_name: 'Pérez',
      last_name: 'Gómez',
      area: 'Sistemas',
      mail: 'juan@test.com',
    };

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });
});
