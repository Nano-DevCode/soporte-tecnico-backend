import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpdateResult } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ToolsStatusService } from './tools-status.service';
import { ToolsStatus } from '../entities/tools-status.entity';
import { CreateToolsStatusDto } from '../dto/create-tools-status.dto';

describe('ToolsStatusService', () => {
  let service: ToolsStatusService;

  const mockStatus: ToolsStatus = {
    id: 'status-uuid-1',
    name: 'OPERATIVO',
    description: 'Herramienta en óptimas condiciones',
    createdAt: new Date(),
    updatedAt: new Date(),
    tools: [],
    movementIn: [],
    movementOut: [],
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsStatusService,
        {
          provide: getRepositoryToken(ToolsStatus),
          useValue: mockRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<ToolsStatusService>(ToolsStatusService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateToolsStatusDto = {
      name: 'OPERATIVO',
      description: 'Herramienta en óptimas condiciones',
    };

    it('should create and save a new tools status', async () => {
      mockRepository.create.mockReturnValue(mockStatus);
      mockRepository.save.mockResolvedValue(mockStatus);

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockStatus);
      expect(result).toEqual(mockStatus);
    });

    it('should throw BadRequestException if db error 23503 occurs', async () => {
      mockRepository.create.mockReturnValue(mockStatus);
      mockRepository.save.mockRejectedValue({
        code: '23503',
        detail: 'Foreign key violation',
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on unexpected db error', async () => {
      mockRepository.create.mockReturnValue(mockStatus);
      mockRepository.save.mockRejectedValue(new Error('DB failure'));

      await expect(service.create(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all tools statuses', async () => {
      const statuses = [mockStatus];
      mockRepository.find.mockResolvedValue(statuses);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual({ toolsStatus: statuses });
    });
  });

  describe('update', () => {
    it('should update tools status', async () => {
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      mockRepository.update.mockResolvedValue(updateResult);

      const result = await service.update('status-uuid-1', {
        name: 'ACTUALIZADO',
      });

      expect(mockRepository.update).toHaveBeenCalledWith('status-uuid-1', {
        name: 'ACTUALIZADO',
      });
      expect(result).toEqual(updateResult);
    });

    it('should catch error and throw via handleDBExceptions', async () => {
      mockRepository.update.mockRejectedValue({
        code: '23503',
        detail: 'FK violation',
      });

      await expect(
        service.update('status-uuid-1', { name: 'ACTUALIZADO' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('seed', () => {
    it('should create all seed statuses and return complete: true', async () => {
      mockRepository.create.mockImplementation((d) => d);
      mockRepository.save.mockResolvedValue(mockStatus);

      const result = await service.seed();

      expect(result).toEqual({ complete: true });
    });

    it('should handle error during seed', async () => {
      mockRepository.create.mockReturnValue(mockStatus);
      mockRepository.save.mockRejectedValue(new Error('Seed failed'));

      await expect(service.seed()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
