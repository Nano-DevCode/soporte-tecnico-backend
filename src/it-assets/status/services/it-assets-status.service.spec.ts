import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ItAssetsStatusService } from './it-assets-status.service';
import { ItAssetsStatus } from '../entities/it-assets-status.entity';
import { CreateItAssetsStatusDto } from '../dto/create-it-assets-status.dto';
import { UpdateItAssetsStatusDto } from '../dto/update-it-assets-status.dto';

describe('ItAssetsStatusService', () => {
  let service: ItAssetsStatusService;
  let repository: jest.Mocked<Repository<ItAssetsStatus>>;

  const mockStatus: ItAssetsStatus = {
    id: 'status-uuid-1',
    name: 'Operativo',
    description: 'Activo en servicio',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItAssetsStatusService,
        {
          provide: getRepositoryToken(ItAssetsStatus),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
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

    service = module.get<ItAssetsStatusService>(ItAssetsStatusService);
    repository = module.get(getRepositoryToken(ItAssetsStatus));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y guardar un estado correctamente', async () => {
      const dto: CreateItAssetsStatusDto = {
        name: 'Operativo',
        description: 'Activo en servicio',
      };
      repository.create.mockReturnValue(mockStatus);
      repository.save.mockResolvedValue(mockStatus);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockStatus);
      expect(result).toEqual(mockStatus);
    });

    it('debe lanzar BadRequestException si hay error de llave foránea (23503)', async () => {
      repository.create.mockReturnValue(mockStatus);
      repository.save.mockRejectedValue({
        code: '23503',
        detail: 'Key is still referenced',
      });

      await expect(
        service.create({ name: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar InternalServerErrorException en otros errores', async () => {
      repository.create.mockReturnValue(mockStatus);
      repository.save.mockRejectedValue(new Error('DB failure'));

      await expect(
        service.create({ name: 'Test' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('debe listar todos los estados', async () => {
      repository.find.mockResolvedValue([mockStatus]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual({ itAssetsStatus: [mockStatus] });
    });
  });

  describe('update', () => {
    it('debe actualizar el estado', async () => {
      const dto: UpdateItAssetsStatusDto = { name: 'Dañado' };
      const updateResult = { generatedMaps: [], raw: [], affected: 1 };
      repository.update.mockResolvedValue(updateResult);

      const result = await service.update('status-uuid-1', dto);

      expect(repository.update).toHaveBeenCalledWith('status-uuid-1', dto);
      expect(result).toEqual(updateResult);
    });
  });

  describe('seed', () => {
    it('debe ejecutar el seed de estados', async () => {
      repository.create.mockReturnValue(mockStatus);
      repository.save.mockResolvedValue(mockStatus);

      const result = await service.seed();

      expect(result).toEqual({ complete: true });
    });
  });
});
