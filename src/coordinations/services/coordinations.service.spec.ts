import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CoordinationsService } from './coordinations.service';
import { Coordination } from '../entities/coordination.entity';
import { CreateCoordinationDto } from '../dto/create-coordination.dto';
import { UpdateCoordinationDto } from '../dto/update-coordination.dto';

describe('CoordinationsService', () => {
  let service: CoordinationsService;
  let repo: jest.Mocked<Repository<Coordination>>;

  const mockCoordination: Coordination = {
    id: 'coord-uuid-1',
    name: 'Coordinación de Sistemas',
    createdAt: new Date(),
    updatedAt: new Date(),
    staffMembers: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoordinationsService,
        {
          provide: getRepositoryToken(Coordination),
          useValue: {
            create: jest.fn().mockReturnValue(mockCoordination),
            save: jest.fn().mockResolvedValue(mockCoordination),
            find: jest.fn().mockResolvedValue([mockCoordination]),
            findOne: jest.fn().mockResolvedValue(mockCoordination),
            findOneBy: jest.fn().mockResolvedValue(mockCoordination),
            preload: jest.fn().mockResolvedValue(mockCoordination),
            clear: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<CoordinationsService>(CoordinationsService);
    repo = module.get(getRepositoryToken(Coordination));

    jest.clearAllMocks();
    service['logger'].error = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y guardar una coordinación exitosamente', async () => {
      const dto: CreateCoordinationDto = { name: 'Coordinación de Sistemas' };
      const result = await service.create(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(mockCoordination);
    });

    it('debe manejar error 23505 lanzando BadRequestException', async () => {
      repo.save.mockRejectedValueOnce({
        code: '23505',
        detail: 'Name already exists',
      });
      await expect(
        service.create({ name: 'Coordinación de Sistemas' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('debe retornar lista de coordinaciones', async () => {
      const result = await service.findAll();
      expect(repo.find).toHaveBeenCalled();
      expect(result).toEqual([mockCoordination]);
    });
  });

  describe('findOne', () => {
    it('debe retornar una coordinación por su id', async () => {
      const result = await service.findOne('coord-uuid-1');
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'coord-uuid-1' });
      expect(result).toEqual(mockCoordination);
    });
  });

  describe('findUnCordination', () => {
    it('debe retornar el id de "Sin Coordinación" si existe', async () => {
      const result = await service.findUnCordination();
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { name: 'Sin Coordinación' },
      });
      expect(result).toBe('coord-uuid-1');
    });

    it('debe lanzar NotFoundException si no existe "Sin Coordinación"', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(service.findUnCordination()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar una coordinación exitosamente', async () => {
      const dto: UpdateCoordinationDto = { name: 'Nuevo Nombre' };
      const result = await service.update('coord-uuid-1', dto);
      expect(repo.preload).toHaveBeenCalledWith({
        id: 'coord-uuid-1',
        ...dto,
      });
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(mockCoordination);
    });

    it('debe lanzar BadRequestException si la coordinación a actualizar no existe', async () => {
      repo.preload.mockResolvedValueOnce(null);
      await expect(service.update('invalid-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteAllCoordinations', () => {
    it('debe limpiar la tabla de coordinaciones', async () => {
      const result = await service.deleteAllCoordinations();
      expect(repo.clear).toHaveBeenCalled();
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('handleDBExceptions', () => {
    it('debe lanzar InternalServerErrorException en otros errores', () => {
      expect(() =>
        service['handleDBExceptions'](new Error('Unknown Error')),
      ).toThrow(InternalServerErrorException);
    });
  });
});
