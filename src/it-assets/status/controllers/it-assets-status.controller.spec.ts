import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ItAssetsStatusController } from './it-assets-status.controller';
import { ItAssetsStatusService } from '../services/it-assets-status.service';
import { CreateItAssetsStatusDto } from '../dto/create-it-assets-status.dto';
import { UpdateItAssetsStatusDto } from '../dto/update-it-assets-status.dto';

describe('ItAssetsStatusController', () => {
  let controller: ItAssetsStatusController;
  let service: jest.Mocked<ItAssetsStatusService>;

  const mockStatus = {
    id: 'status-uuid-1',
    name: 'Operativo',
    description: 'Activo en funcionamiento normal',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItAssetsStatusController],
      providers: [
        {
          provide: ItAssetsStatusService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            seed: jest.fn(),
            update: jest.fn(),
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

    controller = module.get<ItAssetsStatusController>(ItAssetsStatusController);
    service = module.get(ItAssetsStatusService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe registrar un estado de activo', async () => {
      const dto: CreateItAssetsStatusDto = {
        name: 'Operativo',
        description: 'Activo en funcionamiento normal',
      };
      service.create.mockResolvedValue(mockStatus as unknown as never);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockStatus);
    });
  });

  describe('findAll', () => {
    it('debe retornar lista de estados', async () => {
      const response = { itAssetsStatus: [mockStatus] };
      service.findAll.mockResolvedValue(response as unknown as never);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(response);
    });
  });

  describe('seed', () => {
    it('debe inicializar estados por defecto', async () => {
      service.seed.mockResolvedValue({ complete: true });

      const result = await controller.seed();

      expect(service.seed).toHaveBeenCalled();
      expect(result).toEqual({ complete: true });
    });
  });

  describe('update', () => {
    it('debe actualizar un estado', async () => {
      const dto: UpdateItAssetsStatusDto = {
        name: 'Baja Definitiva',
      };
      const updateResult = { generatedMaps: [], raw: [], affected: 1 };
      service.update.mockResolvedValue(updateResult);

      const result = await controller.update('status-uuid-1', dto);

      expect(service.update).toHaveBeenCalledWith('status-uuid-1', dto);
      expect(result).toEqual(updateResult);
    });
  });
});
