import { Test, TestingModule } from '@nestjs/testing';
import { ItAssetsController } from './it-assets.controller';
import { ItAssetsService } from '../services/it-assets.service';
import { CreateItAssetDto } from '../dto/create-it-asset.dto';
import { UpdateItAssetDto } from '../dto/update-it-asset.dto';
import { FilterItAssetBrandDto } from '../dto/filter-it-asset.dto';
import { ChangeStatusItAssetDto } from '../dto/change-status-it-asset.dto';
import { MulterFile } from 'src/files/files.service';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

describe('ItAssetsController', () => {
  let controller: ItAssetsController;
  let service: jest.Mocked<ItAssetsService>;

  const mockFile = {
    originalname: 'equipo.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test-image'),
    size: 1024,
  } as MulterFile;

  const mockAssetResponse = {
    id: 'asset-uuid-1',
    name: 'Monitor Dell',
    serialNumber: 'SN-12345',
    imageUrl: 'http://bucket/equipo.jpg',
  } as Awaited<ReturnType<ItAssetsService['create']>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItAssetsController],
      providers: [
        {
          provide: ItAssetsService,
          useValue: {
            create: jest.fn(),
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

    controller = module.get<ItAssetsController>(ItAssetsController);
    service = module.get(ItAssetsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO y el archivo, y retornar el resultado', async () => {
      const createDto: CreateItAssetDto = {
        idInventary: 'INV-001',
        serialNumber: 'SN-001',
        name: 'Monitor Dell',
        description: 'Monitor de 24 pulgadas',
        modelId: 'model-uuid',
        statusId: 'status-uuid',
        typeId: 'type-uuid',
        observations: 'Nuevo',
      };

      service.create.mockResolvedValue(mockAssetResponse);

      const result = await controller.create(createDto, mockFile);

      expect(service.create).toHaveBeenCalledWith(createDto, mockFile);
      expect(result).toEqual(mockAssetResponse);
    });
  });

  describe('findAll', () => {
    it('debe llamar a service.findAll con los filtros y retornar el resultado', async () => {
      const filterDto: FilterItAssetBrandDto = {
        limit: 10,
        offset: 0,
        query: 'Dell',
        status: true,
        invoiceId: '',
        typeId: '',
        modelId: '',
        brandId: '',
      };

      const paginatedResponse: Awaited<ReturnType<ItAssetsService['findAll']>> =
        {
          itAssets: [mockAssetResponse],
          meta: { total: 1, page: 1, lastPage: 1 },
        };

      service.findAll.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(paginatedResponse);
    });
  });

  describe('findOne', () => {
    it('debe llamar a service.findOne con el ID provisto y retornar el activo', async () => {
      const id = 'asset-uuid-1';
      service.findOne.mockResolvedValue(mockAssetResponse);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockAssetResponse);
    });
  });

  describe('changeStatus', () => {
    it('debe llamar a service.changeStatus con el ID y el DTO, y retornar el activo actualizado', async () => {
      const id = 'asset-uuid-1';
      const changeStatusDto: ChangeStatusItAssetDto = { status: false };

      const updatedAsset = { ...mockAssetResponse, status: false };
      service.changeStatus.mockResolvedValue(updatedAsset);

      const result = await controller.changeStatus(id, changeStatusDto);

      expect(service.changeStatus).toHaveBeenCalledWith(id, changeStatusDto);
      expect(result).toEqual(updatedAsset);
    });
  });

  describe('update', () => {
    const id = 'asset-uuid-1';
    const updateDto: UpdateItAssetDto = {
      name: 'Monitor Modificado',
    };

    it('debe llamar a service.update con el ID, el DTO y el archivo si se proporciona', async () => {
      const updatedAsset = { ...mockAssetResponse, name: 'Monitor Modificado' };
      service.update.mockResolvedValue(updatedAsset);

      const result = await controller.update(id, updateDto, mockFile);

      expect(service.update).toHaveBeenCalledWith(id, updateDto, mockFile);
      expect(result).toEqual(updatedAsset);
    });

    it('debe llamar a service.update omitiendo el archivo si no se proporciona (undefined)', async () => {
      const updatedAsset = { ...mockAssetResponse, name: 'Monitor Modificado' };
      service.update.mockResolvedValue(updatedAsset);

      const result = await controller.update(id, updateDto, undefined);

      expect(service.update).toHaveBeenCalledWith(id, updateDto, undefined);
      expect(result).toEqual(updatedAsset);
    });
  });
});
