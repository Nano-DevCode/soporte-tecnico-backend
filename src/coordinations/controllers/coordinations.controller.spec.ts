import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { CoordinationsController } from './coordinations.controller';
import { CoordinationsService } from '../services/coordinations.service';
import { Coordination } from '../entities/coordination.entity';
import { CreateCoordinationDto } from '../dto/create-coordination.dto';
import { UpdateCoordinationDto } from '../dto/update-coordination.dto';

describe('CoordinationsController', () => {
  let controller: CoordinationsController;
  let service: jest.Mocked<CoordinationsService>;

  const mockCoordination: Coordination = {
    id: 'coord-uuid-1',
    name: 'Coordinación de Sistemas',
    createdAt: new Date(),
    updatedAt: new Date(),
    staffMembers: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoordinationsController],
      providers: [
        {
          provide: CoordinationsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockCoordination),
            findAll: jest.fn().mockResolvedValue([mockCoordination]),
            findOne: jest.fn().mockResolvedValue(mockCoordination),
            update: jest.fn().mockResolvedValue(mockCoordination),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    controller = module.get<CoordinationsController>(CoordinationsController);
    service = module.get(CoordinationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO', async () => {
      const dto: CreateCoordinationDto = { name: 'Coordinación de Sistemas' };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCoordination);
    });
  });

  describe('findAll', () => {
    it('debe llamar a service.findAll', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockCoordination]);
    });
  });

  describe('findOne', () => {
    it('debe llamar a service.findOne con el id', async () => {
      const result = await controller.findOne('coord-uuid-1');
      expect(service.findOne).toHaveBeenCalledWith('coord-uuid-1');
      expect(result).toEqual(mockCoordination);
    });
  });

  describe('update', () => {
    it('debe llamar a service.update con id y dto', async () => {
      const dto: UpdateCoordinationDto = { name: 'Nuevo Nombre' };
      const result = await controller.update('coord-uuid-1', dto);
      expect(service.update).toHaveBeenCalledWith('coord-uuid-1', dto);
      expect(result).toEqual(mockCoordination);
    });
  });
});

