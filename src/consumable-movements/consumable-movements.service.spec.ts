import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, QueryRunner } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConsumableMovementsService } from './consumable-movements.service';
import { ConsumableMovement } from './entities/consumable-movement.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { CreateConsumableMovementDto } from './dto/create-consumable-movement.dto';

describe('ConsumableMovementsService - registerOutput', () => {
  let service: ConsumableMovementsService;
  let ticketRepository: jest.Mocked<Repository<Ticket>>;

  // Usamos jest.MockedFunction o Partial<QueryRunner> sin sobreescribir destructivamente 'manager'
  let queryRunnerMock: Partial<QueryRunner>;
  let managerMock: {
    findOneBy: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    // 1. Creamos los mocks de las funciones del Manager por separado
    managerMock = {
      findOneBy: jest.fn(),
      find: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((_entity: any, obj: Record<string, unknown>) =>
          Promise.resolve(obj),
        ),
      create: jest
        .fn()
        .mockImplementation((_entity: any, obj: Record<string, unknown>) => ({
          id: 'movement-uuid-1',
          ...obj,
        })),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxId: 5 }),
      }),
    };

    // 2. Armamos el QueryRunner mockeado casteando el manager a EntityManager
    queryRunnerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: managerMock as unknown as EntityManager,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumableMovementsService,
        {
          provide: getRepositoryToken(ConsumableMovement),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<ConsumableMovementsService>(
      ConsumableMovementsService,
    );
    ticketRepository = module.get(getRepositoryToken(Ticket));
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  describe('registerOutput - Validaciones Previas', () => {
    it('debe lanzar BadRequestException si el arreglo de items está vacío', async () => {
      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 1,
        id_departament_consumable: 'dep-1',
        observations: 'Consumo por mantenimiento',
        items: [],
      };

      await expect(service.registerOutput(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si la aplicación es por Ticket (id=2) pero no se proporciona id_ticket', async () => {
      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 2,
        id_departament_consumable: 'dep-1',
        items: [{ id_consumable: 'c-1', quantity_consumable: 2 }],
      };

      await expect(service.registerOutput(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar NotFoundException si el ticket con id_movement_aplication=2 no existe en BD', async () => {
      ticketRepository.findOne.mockResolvedValue(null);

      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 2,
        id_ticket: 'ticket-inexistente',
        id_departament_consumable: 'dep-1',
        items: [{ id_consumable: 'c-1', quantity_consumable: 2 }],
      };

      await expect(service.registerOutput(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar BadRequestException si no es aplicación 2 y las observaciones vienen vacías o con espacios', async () => {
      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 1,
        id_departament_consumable: 'dep-1',
        observations: '    ',
        items: [{ id_consumable: 'c-1', quantity_consumable: 2 }],
      };

      await expect(service.registerOutput(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('registerOutput - Algoritmo PEPS y Transacción', () => {
    it('debe hacer rollback y lanzar BadRequestException si el stock acumulado de lotes es menor al solicitado', async () => {
      managerMock.findOneBy.mockResolvedValue({
        id: 1,
        acronym: 'SAL',
      });

      // Stock acumulado disponible = 3, Cantidad solicitada = 5
      managerMock.find.mockResolvedValue([
        {
          id: 'batch-1',
          available_stock: 3,
          cost_unit: 10,
          id_consumable: { name: 'Toner Canon' },
        },
      ]);

      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 1,
        id_departament_consumable: 'dep-1',
        observations: 'Entrega de material',
        items: [{ id_consumable: 'c-1', quantity_consumable: 5 }],
      };

      await expect(service.registerOutput(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('debe registrar la salida aplicando correctamente PEPS (FIFO) a través de múltiples lotes con correlativo automático', async () => {
      managerMock.findOneBy.mockResolvedValue({
        id: 1,
        acronym: 'SAL',
      });

      // Lotes ordenados de forma ascendente (PEPS)
      const batch1 = {
        id: 'batch-1',
        available_stock: 5,
        cost_unit: 10.0,
        created_at: new Date(),
      };
      const batch2 = {
        id: 'batch-2',
        available_stock: 10,
        cost_unit: 12.0,
        created_at: new Date(),
      };
      managerMock.find.mockResolvedValue([batch1, batch2]);

      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 1,
        id_departament_consumable: 'dep-1',
        observations: 'Consumo interno de insumos',
        items: [{ id_consumable: 'c-1', quantity_consumable: 8 }], // 5 de batch1 y 3 de batch2
      };

      const result = await service.registerOutput(dto);

      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();

      // Verificación de descuento en los lotes
      expect(batch1.available_stock).toBe(0); // Vaciado por completo
      expect(batch2.available_stock).toBe(7); // Reducido parcialmente (10 - 3)

      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();

      expect(result).toEqual({
        message: 'Lógica de Salida de consumibles fue aplicada con éxito',
        code_movement_aplication: 'SAL_6', // (maxId 5 + 1)
        total_items_processed: 1,
        records_affected: 2, // 2 movimientos generados (1 por lote)
      });
    });

    it('debe usar el folio del Ticket para formar el código si id_movement_aplication es 2', async () => {
      const mockTicket = { id: 'ticket-1', folio: 'TICK-999' } as Ticket;
      ticketRepository.findOne.mockResolvedValue(mockTicket);

      managerMock.findOneBy.mockResolvedValue({
        id: 2,
        acronym: 'TCK',
      });

      const batch = {
        id: 'batch-1',
        available_stock: 10,
        cost_unit: 15.0,
        created_at: new Date(),
      };
      managerMock.find.mockResolvedValue([batch]);

      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 2,
        id_ticket: 'ticket-1',
        id_departament_consumable: 'dep-1',
        items: [{ id_consumable: 'c-1', quantity_consumable: 3 }],
      };

      const result = await service.registerOutput(dto);

      expect(result.code_movement_aplication).toBe('TCK_TICK-999');
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
    });

    it('debe atrapar violaciones de clave foránea en la BD (código 23503) y relanzar BadRequestException', async () => {
      managerMock.findOneBy.mockRejectedValue({
        code: '23503',
      });

      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 1,
        id_departament_consumable: 'dep-invalido',
        observations: 'Intento con clave rota',
        items: [{ id_consumable: 'c-1', quantity_consumable: 1 }],
      };

      await expect(service.registerOutput(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });
  });
});

// import { Test, TestingModule } from '@nestjs/testing';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { DataSource, Repository, QueryRunner } from 'typeorm';
// import { I18nService } from 'nestjs-i18n';
// import { BadRequestException, NotFoundException } from '@nestjs/common';
// import { ConsumableMovementsService } from './consumable-movements.service';
// import { ConsumableMovement } from './entities/consumable-movement.entity';
// import { Ticket } from 'src/tickets/entities/ticket.entity';
// import { CreateConsumableMovementDto } from './dto/create-consumable-movement.dto';

// describe('ConsumableMovementsService - registerOutput', () => {
//   let service: ConsumableMovementsService;
//   let ticketRepository: jest.Mocked<Repository<Ticket>>;
//   let queryRunnerMock: Partial<QueryRunner> & {
//     connect: jest.Mock;
//     startTransaction: jest.Mock;
//     commitTransaction: jest.Mock;
//     rollbackTransaction: jest.Mock;
//     release: jest.Mock;
//     manager: {
//       findOneBy: jest.Mock;
//       find: jest.Mock;
//       save: jest.Mock;
//       create: jest.Mock;
//       createQueryBuilder: jest.Mock;
//     };
//   };

//   beforeEach(async () => {
//     // Configuración del Mock del QueryRunner para transacciones y QueryBuilder
//     queryRunnerMock = {
//       connect: jest.fn().mockResolvedValue(undefined),
//       startTransaction: jest.fn().mockResolvedValue(undefined),
//       commitTransaction: jest.fn().mockResolvedValue(undefined),
//       rollbackTransaction: jest.fn().mockResolvedValue(undefined),
//       release: jest.fn().mockResolvedValue(undefined),
//       manager: {
//         findOneBy: jest.fn(),
//         find: jest.fn(),
//         save: jest
//           .fn()
//           .mockImplementation((_entity: any, obj: Record<string, unknown>) =>
//             Promise.resolve(obj),
//           ),
//         create: jest
//           .fn()
//           .mockImplementation((_entity: any, obj: Record<string, unknown>) => ({
//             id: 'movement-uuid-1',
//             ...obj,
//           })),
//         createQueryBuilder: jest.fn().mockReturnValue({
//           select: jest.fn().mockReturnThis(),
//           getRawOne: jest.fn().mockResolvedValue({ maxId: 5 }),
//         }),
//       },
//     };

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         ConsumableMovementsService,
//         {
//           provide: getRepositoryToken(ConsumableMovement),
//           useValue: {
//             find: jest.fn(),
//             findOne: jest.fn(),
//             createQueryBuilder: jest.fn(),
//           },
//         },
//         {
//           provide: getRepositoryToken(Ticket),
//           useValue: {
//             findOne: jest.fn(),
//           },
//         },
//         {
//           provide: DataSource,
//           useValue: {
//             createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
//           },
//         },
//         {
//           provide: I18nService,
//           useValue: {
//             t: jest.fn().mockImplementation((key: string) => key),
//           },
//         },
//       ],
//     }).compile();

//     service = module.get<ConsumableMovementsService>(
//       ConsumableMovementsService,
//     );
//     ticketRepository = module.get(getRepositoryToken(Ticket));
//   });

//   it('debe estar definido el servicio', () => {
//     expect(service).toBeDefined();
//   });

//   describe('registerOutput - Validaciones Previas', () => {
//     it('debe lanzar BadRequestException si el arreglo de items está vacío', async () => {
//       const dto: CreateConsumableMovementDto = {
//         id_movement_aplication: 1,
//         id_departament_consumable: 'dep-1',
//         observations: 'Consumo por mantenimiento',
//         items: [],
//       };

//       await expect(service.registerOutput(dto)).rejects.toThrow(
//         BadRequestException,
//       );
//     });

//     it('debe lanzar BadRequestException si la aplicación es por Ticket (id=2) pero no se proporciona id_ticket', async () => {
//       const dto: CreateConsumableMovementDto = {
//         id_movement_aplication: 2,
//         id_departament_consumable: 'dep-1',
//         items: [{ id_consumable: 'c-1', quantity_consumable: 2 }],
//       };

//       await expect(service.registerOutput(dto)).rejects.toThrow(
//         BadRequestException,
//       );
//     });

//     it('debe lanzar NotFoundException si el ticket con id_movement_aplication=2 no existe en BD', async () => {
//       ticketRepository.findOne.mockResolvedValue(null);

//       const dto: CreateConsumableMovementDto = {
//         id_movement_aplication: 2,
//         id_ticket: 'ticket-inexistente',
//         id_departament_consumable: 'dep-1',
//         items: [{ id_consumable: 'c-1', quantity_consumable: 2 }],
//       };

//       await expect(service.registerOutput(dto)).rejects.toThrow(
//         NotFoundException,
//       );
//     });

//     it('debe lanzar BadRequestException si no es aplicación 2 y las observaciones vienen vacías o con espacios', async () => {
//       const dto: CreateConsumableMovementDto = {
//         id_movement_aplication: 1,
//         id_departament_consumable: 'dep-1',
//         observations: '    ',
//         items: [{ id_consumable: 'c-1', quantity_consumable: 2 }],
//       };

//       await expect(service.registerOutput(dto)).rejects.toThrow(
//         BadRequestException,
//       );
//     });
//   });

//   describe('registerOutput - Algoritmo PEPS y Transacción', () => {
//     it('debe hacer rollback y lanzar BadRequestException si el stock acumulado de lotes es menor al solicitado', async () => {
//       (queryRunnerMock.manager?.findOneBy as jest.Mock).mockResolvedValue({
//         id: 1,
//         acronym: 'SAL',
//       });

//       // Stock acumulado disponible = 3, Cantidad solicitada = 5
//       (queryRunnerMock.manager?.find as jest.Mock).mockResolvedValue([
//         {
//           id: 'batch-1',
//           available_stock: 3,
//           cost_unit: 10,
//           id_consumable: { name: 'Toner Canon' },
//         },
//       ]);

//       const dto: CreateConsumableMovementDto = {
//         id_movement_aplication: 1,
//         id_departament_consumable: 'dep-1',
//         observations: 'Entrega de material',
//         items: [{ id_consumable: 'c-1', quantity_consumable: 5 }],
//       };

//       await expect(service.registerOutput(dto)).rejects.toThrow(
//         BadRequestException,
//       );
//       expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
//       expect(queryRunnerMock.release).toHaveBeenCalled();
//     });

//     it('debe registrar la salida aplicando correctamente PEPS (FIFO) a través de múltiples lotes con correlativo automático', async () => {
//       (queryRunnerMock.manager?.findOneBy as jest.Mock).mockResolvedValue({
//         id: 1,
//         acronym: 'SAL',
//       });

//       // Lotes ordenados de forma ascendente (PEPS)
//       const batch1 = {
//         id: 'batch-1',
//         available_stock: 5,
//         cost_unit: 10.0,
//         created_at: new Date(),
//       };
//       const batch2 = {
//         id: 'batch-2',
//         available_stock: 10,
//         cost_unit: 12.0,
//         created_at: new Date(),
//       };
//       (queryRunnerMock.manager?.find as jest.Mock).mockResolvedValue([
//         batch1,
//         batch2,
//       ]);

//       const dto: CreateConsumableMovementDto = {
//         id_movement_aplication: 1,
//         id_departament_consumable: 'dep-1',
//         observations: 'Consumo interno de insumos',
//         items: [{ id_consumable: 'c-1', quantity_consumable: 8 }], // 5 de batch1 y 3 de batch2
//       };

//       const result = await service.registerOutput(dto);

//       expect(queryRunnerMock.connect).toHaveBeenCalled();
//       expect(queryRunnerMock.startTransaction).toHaveBeenCalled();

//       // Verificación de descuento en los lotes
//       expect(batch1.available_stock).toBe(0); // Vaciado por completo
//       expect(batch2.available_stock).toBe(7); // Reducido parcialmente (10 - 3)

//       expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
//       expect(queryRunnerMock.release).toHaveBeenCalled();

//       expect(result).toEqual({
//         message: 'Lógica de Salida de consumibles fue aplicada con éxito',
//         code_movement_aplication: 'SAL_6', // (maxId 5 + 1)
//         total_items_processed: 1,
//         records_affected: 2, // 2 movimientos generados (1 por lote)
//       });
//     });

//     it('debe usar el folio del Ticket para formar el código si id_movement_aplication es 2', async () => {
//       const mockTicket = { id: 'ticket-1', folio: 'TICK-999' } as Ticket;
//       ticketRepository.findOne.mockResolvedValue(mockTicket);

//       (queryRunnerMock.manager?.findOneBy as jest.Mock).mockResolvedValue({
//         id: 2,
//         acronym: 'TCK',
//       });

//       const batch = {
//         id: 'batch-1',
//         available_stock: 10,
//         cost_unit: 15.0,
//         created_at: new Date(),
//       };
//       (queryRunnerMock.manager?.find as jest.Mock).mockResolvedValue([batch]);

//       const dto: CreateConsumableMovementDto = {
//         id_movement_aplication: 2,
//         id_ticket: 'ticket-1',
//         id_departament_consumable: 'dep-1',
//         items: [{ id_consumable: 'c-1', quantity_consumable: 3 }],
//       };

//       const result = await service.registerOutput(dto);

//       expect(result.code_movement_aplication).toBe('TCK_TICK-999');
//       expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
//     });

//     it('debe atrapar violaciones de clave foránea en la BD (código 23503) y relanzar BadRequestException', async () => {
//       (queryRunnerMock.manager?.findOneBy as jest.Mock).mockRejectedValue({
//         code: '23503',
//       });

//       const dto: CreateConsumableMovementDto = {
//         id_movement_aplication: 1,
//         id_departament_consumable: 'dep-invalido',
//         observations: 'Intento con clave rota',
//         items: [{ id_consumable: 'c-1', quantity_consumable: 1 }],
//       };

//       await expect(service.registerOutput(dto)).rejects.toThrow(
//         BadRequestException,
//       );
//       expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
//       expect(queryRunnerMock.release).toHaveBeenCalled();
//     });
//   });
// });
