import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ItAssetsService } from './it-assets.service';
import { ItAsset } from '../entities/it-asset.entity';
import { FilesService, MulterFile } from 'src/files/files.service';
import { CreateItAssetDto } from '../dto/create-it-asset.dto';
import { UpdateItAssetDto } from '../dto/update-it-asset.dto';
import { FilterItAssetBrandDto } from '../dto/filter-it-asset.dto';
import { ChangeStatusItAssetDto } from '../dto/change-status-it-asset.dto';
import { MovementType } from 'src/it-assets-movements/entities/it-assets-movement.entity';

describe('ItAssetsService', () => {
  let service: ItAssetsService;
  let itAssetRepository: jest.Mocked<Repository<ItAsset>>;
  let filesService: jest.Mocked<FilesService>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockEntityManager = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockFile = {
    originalname: 'foto.jpg',
    buffer: Buffer.from('test'),
  } as MulterFile;

  const mockAsset = {
    id: 'asset-uuid-1',
    idInventary: 'INV-001',
    serialNumber: 'SN-001',
    name: 'Monitor Dell',
    itAssetStatus: { id: 'status-1' },
    itAssetsType: { id: 'type-1' },
    model: { id: 'model-1' },
    invoice: { id: 'invoice-1' },
  } as unknown as ItAsset;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItAssetsService,
        {
          provide: getRepositoryToken(ItAsset),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            preload: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
        {
          provide: FilesService,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest
              .fn()
              .mockImplementation(
                async <T>(
                  cb: (manager: EntityManager) => Promise<T>,
                ): Promise<T> => {
                  return await cb(
                    mockEntityManager as unknown as EntityManager,
                  );
                },
              ),
          },
        },
      ],
    }).compile();

    service = module.get<ItAssetsService>(ItAssetsService);
    itAssetRepository = module.get(getRepositoryToken(ItAsset));
    filesService = module.get(FilesService);

    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateItAssetDto = {
      idInventary: 'INV-001',
      serialNumber: 'SN-001',
      description: 'Test',
      modelId: 'model-1',
      name: 'Monitor',
      statusId: 'status-1',
      typeId: 'type-1',
      invoiceId: 'invoice-1',
      observations: 'Ingreso inicial',
    };

    it('debe crear un activo, registrar el movimiento, subir imagen y retornar el activo final', async () => {
      mockEntityManager.create.mockReturnValue(mockAsset);
      mockEntityManager.save
        .mockResolvedValueOnce(mockAsset)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          ...mockAsset,
          imageUrl: 'http://url.com/foto.jpg',
        });

      filesService.uploadFile.mockResolvedValue({
        fileName: 'foto.jpg',
        url: 'http://url.com/foto.jpg',
        bucket: 'it-assets-images',
      });

      const result = await service.create(createDto, mockFile);

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        ItAsset,
        expect.objectContaining({
          idInventary: 'INV-001',
          name: 'Monitor',
          invoice: { id: 'invoice-1' },
        }),
      );

      const movementInMatcher: Record<string, unknown> =
        expect.objectContaining({
          observations: 'Ingreso inicial',
        }) as Record<string, unknown>;

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: MovementType.IN,
          movementIn: movementInMatcher,
        }),
      );

      expect(filesService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'it-assets-images',
        'asset-uuid-1',
      );

      expect(result).toHaveProperty('imageUrl', 'http://url.com/foto.jpg');
    });

    it('debe revertir (borrar) el archivo subido si la base de datos falla al final', async () => {
      mockEntityManager.create.mockReturnValue(mockAsset);
      mockEntityManager.save
        .mockResolvedValueOnce(mockAsset)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Fallo crítico al actualizar la URL'));

      filesService.uploadFile.mockResolvedValue({
        fileName: 'foto.jpg',
        url: 'http://url.com/foto.jpg',
        bucket: 'it-assets-images',
      });

      await expect(service.create(createDto, mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(filesService.deleteFile).toHaveBeenCalledWith(
        'it-assets-images',
        'foto.jpg',
      );
    });

    it('debe lanzar ConflictException si el inventario ya existe (Error 23505)', async () => {
      const dbError = {
        code: '23505',
        detail: 'Key ("idInventary")=(INV-001) already exists.',
      };
      mockEntityManager.create.mockReturnValue(mockAsset);
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto, mockFile)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto, mockFile)).rejects.toThrow(
        'errors.itAssets.inventoryAlreadyExists',
      );

      expect(filesService.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe aplicar los filtros, paginación y retornar la data formateada', async () => {
      const filterDto: FilterItAssetBrandDto = {
        limit: 5,
        offset: 10,
        query: 'DELL',
        status: true,
        typeId: 'type-1',
        invoiceId: '',
        modelId: '',
        brandId: '',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockAsset], 15]);

      const result = await service.findAll(filterDto);

      expect(itAssetRepository.createQueryBuilder).toHaveBeenCalledWith(
        'itAsset',
      );

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'itAsset.model',
        'model',
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE :query'),
        { query: '%DELL%' },
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'status = :status',
        { status: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'type.id = :typeId',
        { typeId: 'type-1' },
      );

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);

      expect(result).toEqual({
        itAssets: [mockAsset],
        meta: {
          total: 15,
          page: 3,
          lastPage: 3,
        },
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar el activo con sus relaciones', async () => {
      itAssetRepository.findOne.mockResolvedValue(mockAsset);

      const result = await service.findOne('asset-uuid-1');
      const expectedRelations = expect.any(Object) as unknown as Record<
        string,
        unknown
      >;

      expect(itAssetRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'asset-uuid-1' },
        relations: expectedRelations,
      });
      expect(result).toEqual(mockAsset);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      itAssetRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateItAssetDto = {
      name: 'Monitor Modificado',
      invoiceId: undefined,
    };

    it('debe actualizar los campos de texto y guardar sin tocar relaciones no enviadas', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockAsset);
      mockEntityManager.save.mockResolvedValue({
        ...mockAsset,
        name: 'Monitor Modificado',
      });

      const result = await service.update('asset-uuid-1', updateDto);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(ItAsset, {
        where: { id: 'asset-uuid-1' },
      });
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Monitor Modificado' }),
      );
      expect(result).toHaveProperty('name', 'Monitor Modificado');
    });

    it('debe romper la relación con la factura si invoiceId es enviado vacío o null', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockAsset);
      mockEntityManager.save.mockResolvedValue(mockAsset);

      await service.update('asset-uuid-1', { invoiceId: '' });

      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ invoice: null }),
      );
    });

    it('debe procesar el archivo, actualizar la imageUrl y hacer rollback del archivo si la BD falla', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockAsset);
      mockEntityManager.save.mockRejectedValue(new Error('DB Update Error'));

      filesService.uploadFile.mockResolvedValue({
        fileName: 'nueva-foto.jpg',
        url: 'http://url.com/nueva.jpg',
        bucket: 'it-assets-images',
      });

      await expect(
        service.update('asset-uuid-1', updateDto, mockFile),
      ).rejects.toThrow(InternalServerErrorException);

      expect(filesService.uploadFile).toHaveBeenCalled();
      expect(filesService.deleteFile).toHaveBeenCalledWith(
        'it-assets-images',
        'nueva-foto.jpg',
      );
    });

    it('debe lanzar NotFoundException si el activo no existe', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changeStatus', () => {
    it('debe cambiar el estado lógico exitosamente', async () => {
      const dto: ChangeStatusItAssetDto = { status: false };
      itAssetRepository.preload.mockResolvedValue({
        ...mockAsset,
        status: false,
      });
      itAssetRepository.save.mockResolvedValue({
        ...mockAsset,
        status: false,
      });

      const result = await service.changeStatus('asset-uuid-1', dto);

      expect(itAssetRepository.preload).toHaveBeenCalledWith({
        id: 'asset-uuid-1',
        status: false,
      });
      expect(itAssetRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('status', false);
    });

    it('debe lanzar NotFoundException si preload no encuentra el activo', async () => {
      itAssetRepository.preload.mockResolvedValue(undefined);

      await expect(
        service.changeStatus('invalid-id', { status: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleDBExeptions', () => {
    it('debe lanzar ConflictException para error 23505 (Serial Number)', async () => {
      const dbError = {
        code: '23505',
        detail: 'Key ("serialNumber")=(SN-001) already exists.',
      };
      mockEntityManager.findOne.mockResolvedValue(mockAsset);
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.update('uuid', {})).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('uuid', {})).rejects.toThrow(
        'errors.itAssets.serialNumberAlreadyExists',
      );
    });

    it('debe lanzar ConflictException para error 23503 (Llave Foránea - Model)', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (modelId)=(123) is not present in table.',
      };
      mockEntityManager.findOne.mockResolvedValue(mockAsset);
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.update('uuid', {})).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('uuid', {})).rejects.toThrow(
        'errors.itAssets.modelNotFound',
      );
    });

    it('debe lanzar BadRequestException para un error 23503 genérico', async () => {
      const dbError = {
        code: '23503',
        detail: 'Alguna otra llave foránea falló',
      };
      mockEntityManager.findOne.mockResolvedValue(mockAsset);
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.update('uuid', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
