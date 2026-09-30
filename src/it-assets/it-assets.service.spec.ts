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
import { ItAsset } from './entities/it-asset.entity';
import { FilesService, MulterFile } from 'src/files/files.service';
import { CreateItAssetDto } from './dto/create-it-asset.dto';
import { UpdateItAssetDto } from './dto/update-it-asset.dto';
import { FilterItAssetBrandDto } from './dto/filter-it-asset.dto';
import { ChangeStatusItAssetDto } from './dto/change-status-it-asset.dto';
import { MovementType } from 'src/it-assets-movements/entities/it-assets-movement.entity';

describe('ItAssetsService', () => {
  let service: ItAssetsService;
  let itAssetRepository: jest.Mocked<Repository<ItAsset>>;
  let filesService: jest.Mocked<FilesService>;

  // Mock del QueryBuilder para la búsqueda
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  // Mock del EntityManager para las Transacciones
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
            // Le damos tipado genérico <T> para que TypeScript sepa qué devuelve el callback
            transaction: jest
              .fn()
              .mockImplementation(
                async <T>(
                  cb: (manager: EntityManager) => Promise<T>,
                ): Promise<T> => {
                  // Casteamos nuestro mock de forma segura a EntityManager
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

    // Silenciamos los logs nativos para pruebas de error
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ========================================================================
     CREATE (Transacciones y subida de archivos)
  ======================================================================== */
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
      // Configuramos el mockEntityManager para que retorne objetos válidos
      mockEntityManager.create.mockReturnValue(mockAsset);
      mockEntityManager.save
        .mockResolvedValueOnce(mockAsset) // Primer save (Activo sin imagen)
        .mockResolvedValueOnce({}) // Segundo save (Movimiento)
        .mockResolvedValueOnce({
          ...mockAsset,
          imageUrl: 'http://url.com/foto.jpg',
        }); // Tercer save (Activo con imagen)

      filesService.uploadFile.mockResolvedValue({
        fileName: 'foto.jpg',
        url: 'http://url.com/foto.jpg',
        bucket: 'it-assets-images',
      });

      const result = await service.create(createDto, mockFile);

      // 1. Verificamos la creación del Activo base
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        ItAsset,
        expect.objectContaining({
          idInventary: 'INV-001',
          name: 'Monitor',
          invoice: { id: 'invoice-1' },
        }),
      );

      // 2. Verificamos la creación del Movimiento (Entrada)
      const movementInMatcher: Record<string, unknown> =
        expect.objectContaining({
          observations: 'Ingreso inicial',
        }) as Record<string, unknown>;

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        expect.anything(), // ItAssetsMovement entity
        expect.objectContaining({
          type: MovementType.IN,
          movementIn: movementInMatcher,
        }),
      );

      // 3. Verificamos que se haya subido el archivo usando el ID generado
      expect(filesService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'it-assets-images',
        'asset-uuid-1',
      );

      // 4. Verificamos el retorno
      expect(result).toHaveProperty('imageUrl', 'http://url.com/foto.jpg');
    });

    it('debe revertir (borrar) el archivo subido si la base de datos falla al final', async () => {
      mockEntityManager.create.mockReturnValue(mockAsset);
      mockEntityManager.save
        .mockResolvedValueOnce(mockAsset) // Activo OK
        .mockResolvedValueOnce({}) // Movimiento OK
        .mockRejectedValueOnce(new Error('Fallo crítico al actualizar la URL')); // 💥 Falla al actualizar

      filesService.uploadFile.mockResolvedValue({
        fileName: 'foto.jpg',
        url: 'http://url.com/foto.jpg',
        bucket: 'it-assets-images',
      });

      await expect(service.create(createDto, mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );

      // Validamos que se haya intentado borrar la foto huérfana en MinIO/S3
      expect(filesService.deleteFile).toHaveBeenCalledWith(
        'it-assets-images',
        'foto.jpg',
      );
    });

    // Validamos que funcione el handleDBExeptions
    it('debe lanzar ConflictException si el inventario ya existe (Error 23505)', async () => {
      const dbError = {
        code: '23505',
        detail: 'Key ("idInventary")=(INV-001) already exists.',
      };
      mockEntityManager.create.mockReturnValue(mockAsset);
      mockEntityManager.save.mockRejectedValue(dbError); // Falla desde el primer save

      await expect(service.create(createDto, mockFile)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto, mockFile)).rejects.toThrow(
        'errors.itAssets.inventoryAlreadyExists',
      );

      // No debería subir ni borrar fotos si falla al principio
      expect(filesService.uploadFile).not.toHaveBeenCalled();
    });
  });

  /* ========================================================================
     FIND ALL (QueryBuilder)
  ======================================================================== */
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

      // Verificamos Joins
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'itAsset.model',
        'model',
      );

      // Verificamos búsqueda general
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE :query'),
        { query: '%DELL%' },
      );

      // Verificamos filtros exactos
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'status = :status',
        { status: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'type.id = :typeId',
        { typeId: 'type-1' },
      );

      // Verificamos paginación
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);

      // Verificamos metadatos devueltos
      expect(result).toEqual({
        itAssets: [mockAsset],
        meta: {
          total: 15,
          page: 3, // (10 / 5) + 1
          lastPage: 3, // 15 / 5
        },
      });
    });
  });

  /* ========================================================================
     FIND ONE
  ======================================================================== */
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

  /* ========================================================================
     UPDATE (Transacciones, Rollback de archivos y Null handling)
  ======================================================================== */
  describe('update', () => {
    const updateDto: UpdateItAssetDto = {
      name: 'Monitor Modificado',
      invoiceId: undefined, // No debe tocar la factura
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

      // Enviamos invoiceId como null o string vacío explícitamente
      await service.update('asset-uuid-1', { invoiceId: '' });

      // Verificamos que se haya asignado null a la propiedad invoice antes de guardar
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

      // Verificamos que intentó subir
      expect(filesService.uploadFile).toHaveBeenCalled();
      // Verificamos que borró la imagen al fallar la actualización en base de datos
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

  /* ========================================================================
     CHANGE STATUS
  ======================================================================== */
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

  /* ========================================================================
     HANDLE DB EXCEPTIONS (Probado indirectamente forzando errores en update)
  ======================================================================== */
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
