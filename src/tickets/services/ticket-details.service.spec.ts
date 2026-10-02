import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { TicketDetailsService } from './ticket-details.service';
import { Ticket } from '../entities/ticket.entity';
import { User } from 'src/users/entities/user.entity';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';

describe('TicketDetailsService', () => {
  let service: TicketDetailsService;
  let ticketRepository: jest.Mocked<Repository<Ticket>>;

  const mockEntityManager = {
    findOne: jest.fn(),
  } as unknown as EntityManager;

  const mockRepository = {
    findOne: jest.fn(),
    manager: mockEntityManager,
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketDetailsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<TicketDetailsService>(TicketDetailsService);
    ticketRepository = module.get(getRepositoryToken(Ticket));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(ticketRepository).toBeDefined();
  });

  describe('findOne', () => {
    it('should throw NotFoundException if ticket does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return ticket if exists', async () => {
      const mockTicket = { id: 'uuid-1' };
      mockRepository.findOne.mockResolvedValue(mockTicket);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockTicket);
    });
  });

  describe('findOneByIdWithDetailsOrFail', () => {
    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(mockEntityManager, 'findOne').mockResolvedValue(null);
      await expect(
        service.findOneByIdWithDetailsOrFail('uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return ticket and filter active attends and set currentStatusCode', async () => {
      const mockTicket = {
        id: 'uuid-1',
        ticket_histories: [
          { status: { code: TicketStatus.RECIBIDA } },
          { status: { code: TicketStatus.ATENDIENDO } },
        ],
        attends: [
          { id: 'att-1', is_active: true },
          { id: 'att-2', is_active: false },
        ],
      };
      jest.spyOn(mockEntityManager, 'findOne').mockResolvedValue(mockTicket);

      const result = await service.findOneByIdWithDetailsOrFail('uuid-1');

      expect(result.currentStatusCode).toBe(TicketStatus.ATENDIENDO);
      expect(result.attends).toHaveLength(1);
      expect(result.attends[0].id).toBe('att-1');
    });
  });

  describe('findAuthorizedDetails', () => {
    const baseTicket = {
      id: 'uuid-1',
      ticket_histories: [{ status: { code: TicketStatus.RECIBIDA } }],
      jefe_depto: { id: 'staff-jefe' },
      coordinator: { id: 'staff-coord' },
      attends: [
        {
          technician: { id: 'staff-tech' },
          is_active: true,
        },
      ],
    };

    it('should allow admin role access', async () => {
      jest
        .spyOn(mockEntityManager, 'findOne')
        .mockResolvedValue({ ...baseTicket });

      const adminUser = {
        role: { name: ValidRole.superAdmin },
        staff: { id: 'any-staff' },
      } as User;

      const result = await service.findAuthorizedDetails('uuid-1', adminUser);
      expect(result.id).toBe('uuid-1');
    });

    it('should allow jefe role if matches jefe_depto', async () => {
      jest
        .spyOn(mockEntityManager, 'findOne')
        .mockResolvedValue({ ...baseTicket });

      const jefeUser = {
        role: { name: ValidRole.jefe },
        staff: { id: 'staff-jefe' },
      } as User;

      const result = await service.findAuthorizedDetails('uuid-1', jefeUser);
      expect(result.id).toBe('uuid-1');
    });

    it('should deny jefe role if does not match jefe_depto', async () => {
      jest
        .spyOn(mockEntityManager, 'findOne')
        .mockResolvedValue({ ...baseTicket });

      const wrongJefeUser = {
        role: { name: ValidRole.jefe },
        staff: { id: 'other-staff' },
      } as User;

      await expect(
        service.findAuthorizedDetails('uuid-1', wrongJefeUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow coordinador role if matches coordinator', async () => {
      jest
        .spyOn(mockEntityManager, 'findOne')
        .mockResolvedValue({ ...baseTicket });

      const coordUser = {
        role: { name: ValidRole.coordinador },
        staff: { id: 'staff-coord' },
      } as User;

      const result = await service.findAuthorizedDetails('uuid-1', coordUser);
      expect(result.id).toBe('uuid-1');
    });

    it('should allow tecnico role if matches active technician in attends', async () => {
      jest
        .spyOn(mockEntityManager, 'findOne')
        .mockResolvedValue({ ...baseTicket });

      const techUser = {
        role: { name: ValidRole.tecnico },
        staff: { id: 'staff-tech' },
      } as User;

      const result = await service.findAuthorizedDetails('uuid-1', techUser);
      expect(result.id).toBe('uuid-1');
    });

    it('should throw ForbiddenException for unknown or unpermitted role', async () => {
      jest
        .spyOn(mockEntityManager, 'findOne')
        .mockResolvedValue({ ...baseTicket });

      const unknownUser = {
        role: { name: 'unknown-role' },
        staff: { id: 'staff-tech' },
      } as User;

      await expect(
        service.findAuthorizedDetails('uuid-1', unknownUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllDetailsByIdOrFail', () => {
    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(mockEntityManager, 'findOne').mockResolvedValue(null);
      await expect(service.findAllDetailsByIdOrFail('uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return all details and currentStatusCode', async () => {
      const mockTicket = {
        id: 'uuid-1',
        ticket_histories: [{ status: { code: TicketStatus.SOLUCIONADA } }],
        attends: [{ id: 'att-1', is_active: true }],
      };
      jest.spyOn(mockEntityManager, 'findOne').mockResolvedValue(mockTicket);

      const result = await service.findAllDetailsByIdOrFail('uuid-1');
      expect(result.currentStatusCode).toBe(TicketStatus.SOLUCIONADA);
    });
  });

  describe('findOneByIdOrFail', () => {
    it('should throw NotFoundException if ticket does not exist', async () => {
      jest.spyOn(mockEntityManager, 'findOne').mockResolvedValue(null);
      await expect(service.findOneByIdOrFail('uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return ticket if exists', async () => {
      const mockTicket = { id: 'uuid-1' };
      jest.spyOn(mockEntityManager, 'findOne').mockResolvedValue(mockTicket);
      const result = await service.findOneByIdOrFail('uuid-1');
      expect(result).toEqual(mockTicket);
    });
  });

  describe('getCurrentStatus and getCurrentHistory', () => {
    const mockTicket = {
      ticket_histories: [
        { id: 'h1', status: { code: TicketStatus.RECIBIDA } },
        { id: 'h2', status: { code: TicketStatus.ATENDIENDO } },
      ],
    } as unknown as Ticket;

    it('should return the latest status', () => {
      const status = service.getCurrentStatus(mockTicket);
      expect(status).toEqual({ code: TicketStatus.ATENDIENDO });
    });

    it('should return the latest history', () => {
      const history = service.getCurrentHistory(mockTicket);
      expect(history.id).toBe('h2');
    });
  });
});
