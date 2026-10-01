import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

import { ToolsController } from './tools.controller';
import { ToolsService } from '../services/tools.service';
import { CreateToolDto } from '../dto/create-tool.dto';
import { UpdateToolDto } from '../dto/update-tool.dto';
import { FilterToolDto } from '../dto/filter-tool.dto';
import { ChangeStatusToolDto } from '../dto/change-status-tool.dto';
import { FindByIdsDto } from '../dto/find-by-ids.dto';
import { MulterFile } from 'src/files/files.service';

describe('ToolsController', () => {
  let controller: ToolsController;
  let service: jest.Mocked<ToolsService>;

  const mockFile = {
    originalname: 'herramienta.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test-image'),
    size: 1024,
  } as MulterFile;

  const mockToolResponse = {
    id: 'tool-uuid-1',
    name: 'Taladro Bosch',
    idInventary: 'HER-001',
    imageUrl: 'http://bucket/herramienta.jpg',
    status: true,
  } as Awaited<ReturnType<ToolsService['create']>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolsController],
      providers: [
        {
          provide: ToolsService,
          useValue: {
            create: jest.fn(),
            findByIds: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            changeStatus: jest.fn(),
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

    controller = module.get<ToolsController>(ToolsController);
    service = module.get(ToolsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByIds', () => {
    it('debe llamar a service.findByIds con el DTO y retornar las herramientas', async () => {
      const idsDto: FindByIdsDto = { ids: ['tool-uuid-1'] };
      service.findByIds.mockResolvedValue([mockToolResponse]);

      const result = await controller.findByIds(idsDto);

      expect(service.findByIds).toHaveBeenCalledWith(idsDto);
      expect(result).toEqual([mockToolResponse]);
    });
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO y el archivo, y retornar el resultado', async () => {
      const createDto: CreateToolDto = {
        idInventary: 'HER-001',
        name: 'Taladro Bosch',
        description: 'Taladro de uso general',
        modelId: 'model-uuid',
        statusId: 'status-uuid',
        typeId: 'type-uuid',
        observations: 'Nuevo',
      };

      service.create.mockResolvedValue(mockToolResponse);

      const result = await controller.create(createDto, mockFile);

      expect(service.create).toHaveBeenCalledWith(createDto, mockFile);
      expect(result).toEqual(mockToolResponse);
    });
  });

  describe('findAll', () => {
    it('debe llamar a service.findAll con los filtros y retornar el resultado', async () => {
      const filterDto: FilterToolDto = {
        limit: 10,
        offset: 0,
        query: 'Taladro',
        status: true,
        invoiceId: '',
        typeId: '',
        modelId: '',
        brandId: '',
      };

      const paginatedResponse = {
        tools: [mockToolResponse],
        meta: { total: 1, page: 1, lastPage: 1 },
      };

      service.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(paginatedResponse);
    });
  });

  describe('findOne', () => {
    it('debe llamar a service.findOne con el ID provisto y retornar la herramienta', async () => {
      const id = 'tool-uuid-1';
      service.findOne.mockResolvedValue(mockToolResponse);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockToolResponse);
    });
  });

  describe('changeStatus', () => {
    it('debe llamar a service.changeStatus con el ID y el DTO, y retornar la herramienta actualizada', async () => {
      const id = 'tool-uuid-1';
      const changeStatusDto: ChangeStatusToolDto = { status: false };

      const updatedTool = { ...mockToolResponse, status: false };
      service.changeStatus.mockResolvedValue(updatedTool);

      const result = await controller.changeStatus(id, changeStatusDto);

      expect(service.changeStatus).toHaveBeenCalledWith(id, changeStatusDto);
      expect(result).toEqual(updatedTool);
    });
  });

  describe('update', () => {
    const id = 'tool-uuid-1';
    const updateDto: UpdateToolDto = {
      name: 'Taladro Modificado',
    };

    it('debe llamar a service.update con el ID, el DTO y el archivo si se proporciona', async () => {
      const updatedTool = { ...mockToolResponse, name: 'Taladro Modificado' };
      service.update.mockResolvedValue(updatedTool);

      const result = await controller.update(id, updateDto, mockFile);

      expect(service.update).toHaveBeenCalledWith(id, updateDto, mockFile);
      expect(result).toEqual(updatedTool);
    });

    it('debe llamar a service.update omitiendo el archivo si no se proporciona (undefined)', async () => {
      const updatedTool = { ...mockToolResponse, name: 'Taladro Modificado' };
      service.update.mockResolvedValue(updatedTool);

      const result = await controller.update(id, updateDto, undefined);

      expect(service.update).toHaveBeenCalledWith(id, updateDto, undefined);
      expect(result).toEqual(updatedTool);
    });
  });
});
