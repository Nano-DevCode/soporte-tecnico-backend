import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ToolsMovementsInService } from './tools-movements-in.service';
import { CreateToolsMovementsInDto } from '../dto/create-tools-movements-in.dto';
import { Tool } from 'src/tools/entities/tool.entity';
import { MovementType, ToolsMovement } from '../entities/tools-movement.entity';

describe('ToolsMovementsInService', () => {
  let service: ToolsMovementsInService;

  type MockEntityManager = {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const mockEntityManager: MockEntityManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTool = {
    id: 'tool-uuid',
    inUse: true,
    toolStatus: { id: 'status-old' },
  } as Tool;

  const createDto: CreateToolsMovementsInDto = {
    toolId: 'tool-uuid',
    toolsStatusId: 'status-new',
    observations: 'La herramienta regresó en buen estado',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsMovementsInService,
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
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<ToolsMovementsInService>(ToolsMovementsInService);
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe registrar la entrada correctamente, actualizando la herramienta a inUse=false y creando el movimiento', async () => {
      mockEntityManager.findOne.mockResolvedValue({ ...mockTool });
      mockEntityManager.save.mockResolvedValueOnce({});
      const newMovement = {
        id: 'movement-uuid',
        type: MovementType.IN,
      } as ToolsMovement;
      mockEntityManager.create.mockReturnValue(newMovement);
      mockEntityManager.save.mockResolvedValueOnce(newMovement);

      const result = await service.create(createDto);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Tool, {
        where: { id: createDto.toolId },
      });
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(
        1,
        Tool,
        expect.objectContaining({
          inUse: false,
          toolStatus: { id: 'status-new' },
        }),
      );
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        ToolsMovement,
        expect.objectContaining({
          type: MovementType.IN,
          movementIn: expect.objectContaining({
            toolsStatus: { id: 'status-new' },
            observations: 'La herramienta regresó en buen estado',
          }),
        }),
      );
      expect(result).toEqual(newMovement);
    });

    it('debe lanzar BadRequestException si la herramienta no existe', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.tools.movementsIn.toolNotFound',
      );
    });

    it('debe lanzar ConflictException si la herramienta YA ESTÁ en inventario (inUse: false)', async () => {
      mockEntityManager.findOne.mockResolvedValue({
        ...mockTool,
        inUse: false,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.tools.movementsIn.alreadyInInventory',
      );
    });
  });

  describe('handleDBExceptions', () => {
    beforeEach(() => {
      mockEntityManager.findOne.mockImplementation(() => ({
        ...mockTool,
      }));
    });

    it('debe relanzar errores HttpException nativos', async () => {
      const httpError = new BadRequestException('Error pre-existente');
      mockEntityManager.save.mockRejectedValue(httpError);

      await expect(service.create(createDto)).rejects.toThrow(httpError);
    });

    it('debe lanzar ConflictException en error 23505', async () => {
      const dbError = { code: '23505', detail: 'Llave duplicada de prueba' };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe lanzar ConflictException si falla la foránea del Estado (23503)', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (toolsStatusId)=(...) no existe',
      };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.tools.statusNotFound',
      );
    });

    it('debe lanzar BadRequestException para errores 23503 no contemplados', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (otraLlave)=(...) no existe',
      };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar InternalServerErrorException si es un error desconocido', async () => {
      const unknownError = new Error('Se cayó el servidor SQL');
      mockEntityManager.save.mockRejectedValue(unknownError);

      await expect(service.create(createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
