import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ToolsService } from './tools.service';
import { Tool } from './entities/tool.entity';
import { FilesService, MulterFile } from 'src/files/files.service';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
import { FilterToolDto } from './dto/filter-tool.dto';
import { ChangeStatusToolDto } from './dto/change-status-tool.dto';
import { MovementType } from 'src/tools-movements/entities/tools-movement.entity';

describe('ToolsService', () => {
  let service: ToolsService;
  let toolsRepository: jest.Mocked<Repository<Tool>>;
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
    originalname: 'herramienta.jpg',
    buffer: Buffer.from('test'),
  } as MulterFile;

  const mockTool = {
    id: 'tool-uuid-1',
    idInventary: 'HER-001',
    name: 'Taladro Bosch',
    toolStatus: { id: 'status-1' },
    toolType: { id: 'type-1' },
    model: { id: 'model-1' },
    invoice: { id: 'invoice-1' },
  } as unknown as Tool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsService,
        {
          provide: getRepositoryToken(Tool),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            find: jest.fn(),
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
              .mockImplementation(async <T>(cb: NewType<T>) => {
                return await cb(mockEntityManager);
              }),
          },
        },
      ],
    }).compile();

    service = module.get<ToolsService>(ToolsService);
    toolsRepository = module.get(getRepositoryToken(Tool));
    filesService = module.get(FilesService);

    // Silenciamos los logs nativos para pruebas de error
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ========================================================================
     CREATE
  ======================================================================== */
  describe('create', () => {
    const createDto: CreateToolDto = {
      idInventary: 'HER-001',
      description: 'Taladro nuevo',
      modelId: 'model-1',
      name: 'Taladro Bosch',
      statusId: 'status-1',
      typeId: 'type-1',
      invoiceId: 'invoice-1',
      observations: 'Ingreso inicial',
    };

    it('debe crear una herramienta, registrar el movimiento, subir imagen y retornar la herramienta final', async () => {
      mockEntityManager.create.mockReturnValue(mockTool);
      mockEntityManager.save
        .mockResolvedValueOnce(mockTool) // 1. Herramienta base
        .mockResolvedValueOnce({}) // 2. Movimiento inicial
        .mockResolvedValueOnce({
          ...mockTool,
          imageUrl: 'http://url.com/herramienta.jpg',
        }); // 3. Herramienta actualizada

      filesService.uploadFile.mockResolvedValue({
        fileName: 'herramienta.jpg',
        url: 'http://url.com/herramienta.jpg',
        bucket: 'tools-images',
      });

      const result = await service.create(createDto, mockFile);

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        Tool,
        expect.objectContaining({ name: 'Taladro Bosch' }),
      );

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ type: MovementType.IN }),
      );

      expect(filesService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'tools-images',
        'tool-uuid-1',
      );

      expect(result).toHaveProperty(
        'imageUrl',
        'http://url.com/herramienta.jpg',
      );
    });

    it('debe revertir (borrar) el archivo subido si la base de datos falla al final', async () => {
      mockEntityManager.create.mockReturnValue(mockTool);
      mockEntityManager.save
        .mockResolvedValueOnce(mockTool)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('DB Falló'));

      filesService.uploadFile.mockResolvedValue({
        fileName: 'foto.jpg',
        url: 'http://url.com/foto.jpg',
        bucket: 'tools-images',
      });

      await expect(service.create(createDto, mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(filesService.deleteFile).toHaveBeenCalledWith(
        'tools-images',
        'foto.jpg',
      );
    });
  });

  /* ========================================================================
     FIND BY IDS
  ======================================================================== */
  describe('findByIds', () => {
    it('debe retornar array vacío si no se envían ids', async () => {
      const result = await service.findByIds({ ids: [] });
      expect(result).toEqual([]);
      expect(toolsRepository.find).not.toHaveBeenCalled();
    });

    it('debe buscar las herramientas por In() si se proveen ids', async () => {
      toolsRepository.find.mockResolvedValue([mockTool]);

      const result = await service.findByIds({ ids: ['tool-uuid-1'] });
      const expectedWhere: Record<string, boolean> = {
        status: true,
        inUse: false,
      };

      expect(toolsRepository.find).toHaveBeenCalledWith({
        where: expect.objectContaining(expectedWhere) as Record<
          string,
          boolean
        >,
        relations: ['model', 'model.brand', 'toolType'],
      });
      expect(result).toEqual([mockTool]);
    });
  });

  /* ========================================================================
     FIND ALL
  ======================================================================== */
  describe('findAll', () => {
    it('debe aplicar los filtros, paginación y retornar la data formateada', async () => {
      const filterDto = {
        limit: 5,
        offset: 10,
        query: 'Taladro',
        status: true,
        invoiceId: undefined,
        typeId: undefined,
        modelId: undefined,
        brandId: undefined,
      } as unknown as FilterToolDto;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockTool], 15]);

      const result = await service.findAll(filterDto);

      expect(toolsRepository.createQueryBuilder).toHaveBeenCalledWith('tool');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(5);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE :query'),
        { query: '%Taladro%' },
      );
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'tool.updatedAt',
        'DESC',
      );

      expect(result.meta).toEqual({
        total: 15,
        page: 3, // (10 / 5) + 1
        lastPage: 3, // 15 / 5
      });
    });
  });

  /* ========================================================================
     FIND ONE
  ======================================================================== */
  describe('findOne', () => {
    it('debe retornar la herramienta con sus relaciones', async () => {
      toolsRepository.findOne.mockResolvedValue(mockTool);

      const result = await service.findOne('tool-uuid-1');
      expect(result).toEqual(mockTool);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      toolsRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /* ========================================================================
     UPDATE
  ======================================================================== */
  describe('update', () => {
    const updateDto: UpdateToolDto = {
      name: 'Taladro Modificado',
    };

    it('debe actualizar campos y guardar sin tocar factura si se manda null', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockTool);
      mockEntityManager.save.mockResolvedValue(mockTool);

      await service.update('tool-uuid-1', { invoiceId: '' });

      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ invoice: null }),
      );
    });

    it('debe procesar el archivo, actualizar y hacer rollback del archivo si la BD falla', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockTool);
      mockEntityManager.save.mockRejectedValue(new Error('DB Error'));

      filesService.uploadFile.mockResolvedValue({
        fileName: 'nueva.jpg',
        url: 'http://url/nueva.jpg',
        bucket: 'tools-images',
      });

      await expect(
        service.update('tool-uuid-1', updateDto, mockFile),
      ).rejects.toThrow(InternalServerErrorException);

      expect(filesService.deleteFile).toHaveBeenCalledWith(
        'tools-images',
        'nueva.jpg',
      );
    });

    it('debe lanzar NotFoundException si la herramienta no existe (requiere fix en handleDBExeptions)', async () => {
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
      const dto: ChangeStatusToolDto = { status: false };
      toolsRepository.preload.mockResolvedValue({
        ...mockTool,
        status: false,
      });
      toolsRepository.save.mockResolvedValue({
        ...mockTool,
        status: false,
      });

      const result = await service.changeStatus('tool-uuid-1', dto);
      expect(result.status).toBe(false);
    });

    it('debe lanzar NotFoundException si no la encuentra', async () => {
      toolsRepository.preload.mockResolvedValue(undefined);
      await expect(
        service.changeStatus('invalid-id', { status: false }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /* ========================================================================
     HANDLE DB EXCEPTIONS
  ======================================================================== */
  describe('handleDBExeptions', () => {
    it('debe lanzar ConflictException para error 23505 (Inventario)', async () => {
      const dbError = {
        code: '23505',
        detail: 'Key ("idInventary")=(HER-001) already exists.',
      };
      mockEntityManager.findOne.mockResolvedValue(mockTool);
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.update('uuid', {})).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('uuid', {})).rejects.toThrow(
        'errors.tools.inventoryAlreadyExists',
      );
    });

    it('debe lanzar ConflictException para error 23503 (Modelo)', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (modelId)=(123) is not present in table.',
      };
      mockEntityManager.findOne.mockResolvedValue(mockTool);
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.update('uuid', {})).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('uuid', {})).rejects.toThrow(
        'errors.tools.modelNotFound',
      );
    });
  });
});
