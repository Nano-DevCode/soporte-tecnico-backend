import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ToolsMovementsOutService } from './tools-movements-out.service';
import { CreateToolsMovementsOutDto } from '../dto/create-tools-movements-out.dto';
import { Tool } from 'src/tools/entities/tool.entity';
import { ToolsMovement, MovementType } from '../entities/tools-movement.entity';

describe('ToolsMovementsOutService', () => {
  let service: ToolsMovementsOutService;

  const mockEntityManager: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  } = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTool = {
    id: 'tool-uuid',
    inUse: false,
    toolStatus: { id: 'status-old' },
  } as Tool;

  const createDto: CreateToolsMovementsOutDto = {
    toolId: 'tool-uuid',
    toolStatusId: 'status-new',
    observations: 'Salida a campo',
    description: 'Se lleva el equipo para reparación',
    voucher: 'VALE-123',
    staffId: 'staff-uuid',
    ticketId: 'ticket-uuid',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsMovementsOutService,
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

    service = module.get<ToolsMovementsOutService>(ToolsMovementsOutService);
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe registrar la salida correctamente, actualizando la herramienta y creando el movimiento', async () => {
      mockEntityManager.findOne.mockResolvedValue({ ...mockTool });
      mockEntityManager.save.mockResolvedValueOnce({});
      const newMovement = { id: 'movement-uuid', type: MovementType.OUT };
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
          inUse: true,
          toolStatus: { id: 'status-new' },
        }),
      );
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        ToolsMovement,
        expect.objectContaining({
          type: MovementType.OUT,
          movementOut: expect.objectContaining({
            toolStatus: { id: 'status-new' },
            observations: 'Salida a campo',
            staff: { id: 'staff-uuid' },
            ticket: { id: 'ticket-uuid' },
          }),
        }),
      );
      expect(result).toEqual(newMovement);
    });

    it('debe registrar la salida aunque no se envíen staffId y ticketId', async () => {
      const createDtoWithoutOptionals: CreateToolsMovementsOutDto = {
        ...createDto,
        staffId: undefined,
        ticketId: undefined,
      };

      mockEntityManager.findOne.mockResolvedValue({ ...mockTool });
      mockEntityManager.save.mockResolvedValue({});
      mockEntityManager.create.mockReturnValue({});

      await service.create(createDtoWithoutOptionals);

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        ToolsMovement,
        expect.objectContaining({
          movementOut: expect.objectContaining({
            staff: undefined,
            ticket: undefined,
          }),
        }),
      );
    });

    it('debe lanzar BadRequestException si la herramienta no existe', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'tools.movementsOut.toolNotFound',
      );
    });

    it('debe lanzar ConflictException si la herramienta ya está en uso', async () => {
      mockEntityManager.findOne.mockResolvedValue({ ...mockTool, inUse: true });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'tools.movementsOut.alreadyInUse',
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
      const dbError = { code: '23505', detail: 'Llave duplicada detalle' };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe lanzar ConflictException si falla la foránea del Estado (23503)', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (toolStatusId)=(...) no existe',
      };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.tools.statusNotFound',
      );
    });

    it('debe lanzar ConflictException si falla la foránea del Personal/Staff (23503)', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (staffId)=(...) no existe',
      };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.tools.movementsOut.staffNotFound',
      );
    });

    it('debe lanzar ConflictException si falla la foránea del Ticket (23503)', async () => {
      const dbError = {
        code: '23503',
        detail: 'Key (ticketId)=(...) no existe',
      };
      mockEntityManager.save.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'errors.tools.movementsOut.ticketNotFound',
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
      const unknownError = new Error('Se cayó la base de datos');
      mockEntityManager.save.mockRejectedValue(unknownError);

      await expect(service.create(createDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
