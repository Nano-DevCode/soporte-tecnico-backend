import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import { ToolsMovementsInService } from './tools-movements-in.service';
import { CreateToolsMovementsInDto } from './dto/create-tools-movements-in.dto';
import { Tool } from 'src/tools/entities/tool.entity';
import {
  MovementType,
  ToolsMovement,
} from 'src/tools-movements/entities/tools-movement.entity';

describe('ToolsMovementsInService', () => {
  let service: ToolsMovementsInService;

  type MockEntityManager = {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  // Mock del EntityManager para simular las transacciones
  const mockEntityManager: MockEntityManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  // Mock de una herramienta que actualmente está fuera/en uso (inUse: true)
  const mockTool = {
    id: 'tool-uuid',
    inUse: true,
    toolStatus: { id: 'status-old' },
  } as Tool;

  // Mock del DTO de entrada
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
            t: jest.fn((key: string) => key), // Retorna la llave directamente para facilitar las aserciones
          },
        },
      ],
    }).compile();

    service = module.get<ToolsMovementsInService>(ToolsMovementsInService);

    // Silenciamos los logs de error nativos para mantener la terminal limpia
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ========================================================================
     PRUEBAS DE CREACIÓN (ENTRADAS)
  ======================================================================== */
  describe('create', () => {
    it('debe registrar la entrada correctamente, actualizando la herramienta a inUse=false y creando el movimiento', async () => {
      // Retornamos un clon para evitar contaminación de referencias
      mockEntityManager.findOne.mockResolvedValue({ ...mockTool });
      mockEntityManager.save.mockResolvedValueOnce({}); // Save de la herramienta
      const newMovement = {
        id: 'movement-uuid',
        type: MovementType.IN,
      } as ToolsMovement;
      mockEntityManager.create.mockReturnValue(newMovement);
      mockEntityManager.save.mockResolvedValueOnce(newMovement); // Save del movimiento

      const result: ToolsMovement = await service.create(createDto);

      // 1. Verifica que buscó la herramienta
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Tool, {
        where: { id: createDto.toolId },
      });

      // 2. Verifica que la herramienta cambió a inUse=false y actualizó el estado
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(
        1,
        Tool,
        expect.objectContaining({
          inUse: false,
          toolStatus: { id: 'status-new' },
        }),
      );

      // 3. Verifica que se creó el movimiento de tipo IN
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        ToolsMovement,
        expect.objectContaining({
          type: MovementType.IN,
          movementIn: expect.objectContaining({
            toolsStatus: { id: 'status-new' },
            observations: 'La herramienta regresó en buen estado',
          }) as unknown,
        }),
      );

      // 4. Verifica el resultado final
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
      // Herramienta que ya está guardada en el almacén
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

  /* ========================================================================
     PRUEBAS DEL MANEJADOR DE ERRORES DE BASE DE DATOS
  ======================================================================== */
  describe('handleDBExeptions (lanzados indirectamente a través del catch)', () => {
    beforeEach(() => {
      // Retornamos un objeto limpio en cada iteración para evitar contaminación
      mockEntityManager.findOne.mockImplementation(() => ({
        ...mockTool,
      }));
    });

    it('debe relanzar errores HttpException nativos (ej. si falla una validación previa)', async () => {
      const httpError = new BadRequestException('Error pre-existente');
      mockEntityManager.save.mockRejectedValue(httpError);

      await expect(service.create(createDto)).rejects.toThrow(httpError);
    });

    it('debe lanzar ConflictException en error 23505 (Llave duplicada genérica)', async () => {
      const dbError = { code: '23505', detail: 'Llave duplicada de prueba' };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Llave duplicada de prueba',
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
      await expect(service.create(createDto)).rejects.toThrow(
        'Key (otraLlave)=(...) no existe',
      );
    });

    it('debe lanzar InternalServerErrorException si es un error desconocido', async () => {
      const unknownError = new Error('Se cayó el servidor SQL');
      mockEntityManager.save.mockRejectedValue(unknownError);

      await expect(service.create(createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.internalServerError',
      );
    });
  });
});
