import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { EntityManager } from 'typeorm';
import { AttendsService } from './attends.service';
import { Attend } from './entities/attend.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { Staff } from 'src/users/entities/staff.entity';
import { User } from 'src/users/entities/user.entity';

describe('AttendsService', () => {
  let service: AttendsService;

  const mockQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockEntityManager = {
    find: jest.fn(),
    create: jest
      .fn()
      .mockImplementation(<T>(entity: unknown, dto: T): T => dto),
    save: jest.fn(),
    update: jest.fn(),
    getRepository: jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    }),
  } as unknown as EntityManager;

  const mockAttendsRepository = {
    manager: mockEntityManager,
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendsService,
        {
          provide: getRepositoryToken(Attend),
          useValue: mockAttendsRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<AttendsService>(AttendsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('attendTicketWithEntities', () => {
    it('debería desactivar técnicos removidos e insertar técnicos nuevos', async () => {
      const ticket = { id: 'ticket-1' } as Ticket;
      const tech1 = { id: 'tech-1' } as Staff;
      const tech2 = { id: 'tech-2' } as Staff;

      const currentAttend = {
        id: 'attend-1',
        technician: tech1,
        is_active: true,
      } as Attend;

      mockEntityManager.find = jest.fn().mockResolvedValue([currentAttend]);

      const result = await service.attendTicketWithEntities(ticket, [tech2]);

      expect(mockEntityManager.find).toHaveBeenCalled();
      expect(mockEntityManager.create).toHaveBeenCalledWith(Attend, {
        ticket: ticket,
        technician: tech2,
        is_active: true,
      });

      expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(1, Attend, [
        expect.objectContaining({ id: 'attend-1', is_active: false }),
      ]);
      expect(mockEntityManager.save).toHaveBeenNthCalledWith(2, Attend, [
        expect.objectContaining({ technician: tech2, is_active: true }),
      ]);

      expect(result).toEqual({ deactivated: 1, inserted: 1 });
    });

    it('no debería interactuar con la bd si no hay cambios', async () => {
      const ticket = { id: 'ticket-1' } as Ticket;
      const tech1 = { id: 'tech-1' } as Staff;

      const currentAttend = {
        id: 'attend-1',
        technician: tech1,
        is_active: true,
      } as Attend;

      mockEntityManager.find = jest.fn().mockResolvedValue([currentAttend]);

      const result = await service.attendTicketWithEntities(ticket, [tech1]);

      expect(mockEntityManager.save).not.toHaveBeenCalled();
      expect(result).toEqual({ deactivated: 0, inserted: 0 });
    });
  });

  describe('getCurrentAttends', () => {
    it('debería retornar las atenciones activas actuales del ticket', async () => {
      const expectedAttends = [
        { id: 'attend-1', is_active: true, technician: { id: 'tech-1' } },
      ] as Attend[];

      mockEntityManager.find = jest.fn().mockResolvedValue(expectedAttends);

      const result = await service.getCurrentAttends('ticket-1');

      expect(result).toEqual(expectedAttends);
      expect(mockEntityManager.find).toHaveBeenCalledWith(
        Attend,
        expect.objectContaining({
          where: { ticket: { id: 'ticket-1' }, is_active: true },
          relations: ['technician'],
        }),
      );
    });
  });

  describe('startAttention', () => {
    it('debería actualizar is_attending a true si ningún técnico está ocupado', async () => {
      const mockUser = { id: 'user-1' } as User;
      const currentAttends = [
        {
          technician: {
            id: 'tech-1',
            user: { id: 'user-1' },
          },
        },
      ] as unknown as Attend[];

      mockEntityManager.find = jest.fn().mockResolvedValue(currentAttends);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await service.startAttention('ticket-1', mockUser, mockEntityManager);

      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(mockEntityManager.update).toHaveBeenCalledWith(
        Attend,
        { ticket: 'ticket-1', is_active: true },
        { is_attending: true },
      );
    });

    it('debería lanzar ConflictException si un técnico ya está ocupado en otro ticket', async () => {
      const mockUser = { id: 'user-1' } as User;
      const currentAttends = [
        {
          technician: {
            id: 'tech-1',
            name: 'Juan Perez',
            user: { id: 'user-1' },
          },
        },
      ] as unknown as Attend[];
      const busyAttend = {
        technician: { id: 'tech-1', name: 'Juan Perez' },
      } as Attend;

      mockEntityManager.find = jest.fn().mockResolvedValue(currentAttends);
      mockQueryBuilder.getOne.mockResolvedValue(busyAttend);

      const startPromise = service.startAttention(
        'ticket-1',
        mockUser,
        mockEntityManager,
      );

      await expect(startPromise).rejects.toThrow(ConflictException);
      await expect(startPromise).rejects.toThrow(
        'errors.tickets.technician_already_busy',
      );
      expect(mockEntityManager.update).not.toHaveBeenCalled();
    });
  });

  describe('endAttention', () => {
    it('debería actualizar is_attending a false', async () => {
      await service.endAttention('ticket-1');

      expect(mockEntityManager.update).toHaveBeenCalledWith(
        Attend,
        { ticket: 'ticket-1', is_active: true },
        { is_attending: false },
      );
    });
  });
});
