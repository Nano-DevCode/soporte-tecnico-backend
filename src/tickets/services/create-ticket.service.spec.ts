import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from 'nestjs-i18n';
import { CreateTicketService } from './create-ticket.service';
import { SchoolPeriodsService } from 'src/school-periods/school-periods.service';
import { TicketHistoryService } from 'src/ticket-history/ticket-history.service';
import { IssueTypeService } from '../../issue_type/issue_type.service';
import { TicketsService } from './tickets.service';
import { UsersService } from '../../users/services/users.service';
import { PdfsService } from 'src/pdfs/services/pdfs.service';
import { FolioCountersService } from 'src/folio-counters/folio-counters.service';
import { RouteTicketService } from './route-ticket.service';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { Ticket } from '../entities/ticket.entity';
import { User } from 'src/users/entities/user.entity';
import { Staff } from 'src/users/entities/staff.entity';
import { Document } from 'src/documents/entities/document.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { CreateTicketOnBehalfDto } from '../dto/create-ticket-on-behalf';

jest.mock('src/common/machine/TicketStateMachine.machine', () => {
  const original = jest.requireActual<
    typeof import('src/common/machine/TicketStateMachine.machine')
  >('src/common/machine/TicketStateMachine.machine');
  return {
    ...original,
    transition: jest.fn().mockReturnValue('NUEVA'),
  };
});

describe('CreateTicketService', () => {
  let service: CreateTicketService;

  const mockTransactionManager = {
    save: jest.fn(),
    create: jest
      .fn()
      .mockImplementation(<T>(entity: unknown, dto: T): T => dto),
  };

  const mockDataSource = {
    transaction: jest
      .fn()
      .mockImplementation(
        async (
          cb: (manager: typeof mockTransactionManager) => Promise<unknown>,
        ) => {
          return cb(mockTransactionManager);
        },
      ),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockSchoolPeriodsService = {
    getActiveSchoolPeriodOrFail: jest.fn(),
  };

  const mockTicketHistoryService = {
    findStatusByCodeOrFail: jest.fn(),
    createHistory: jest.fn(),
  };

  const mockIssueTypeService = {
    findOneOrFail: jest.fn(),
  };

  const mockTicketsService = {
    findOneByIdWithDetailsOrFail: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockResponsePdfsService = {
    pdfRequestBucket: jest.fn(),
  };

  const mockFolioCountersService = {
    generateDepartmentTicketFolio: jest.fn(),
    generateOTFolio: jest.fn().mockResolvedValue('OT-2026-0001-CC'),
  };

  const mockRouteTicketService = {
    routeTicket: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTicketService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: SchoolPeriodsService, useValue: mockSchoolPeriodsService },
        { provide: TicketHistoryService, useValue: mockTicketHistoryService },
        { provide: IssueTypeService, useValue: mockIssueTypeService },
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PdfsService, useValue: mockResponsePdfsService },
        { provide: FolioCountersService, useValue: mockFolioCountersService },
        { provide: RouteTicketService, useValue: mockRouteTicketService },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<CreateTicketService>(CreateTicketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create y executeTicketTransaction', () => {
    const mockUser = { id: 'user-uuid' } as User;
    const mockCreateDto = {
      issue_type: 1,
      description: 'Test issue',
      affected_name: 'Name',
      contact_email: 'test@email.com',
      available_hours: '10-12',
      equipment_location: 'CC',
    } as CreateTicketDto;

    it('debería crear el ticket exitosamente y emitir el evento', async () => {
      const mockStaff = {
        id: 'staff-1',
        department: { id: 'dept-1', acronym: 'SYS', priority: 1, status: true },
      } as Staff;

      mockUsersService.findOne.mockResolvedValue({ staff: mockStaff });
      mockIssueTypeService.findOneOrFail.mockResolvedValue({});
      mockSchoolPeriodsService.getActiveSchoolPeriodOrFail.mockResolvedValue({
        id: 'period-1',
        name: '2023-2024',
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });
      mockFolioCountersService.generateDepartmentTicketFolio.mockResolvedValue(
        'SYS-001',
      );

      const mockSavedTicket = { id: 'ticket-uuid', folio: 'SYS-001' } as Ticket;
      mockTransactionManager.save.mockResolvedValue(mockSavedTicket);

      const mockTicketCompleted = {
        id: 'ticket-uuid',
        details: true,
      } as unknown as Ticket;
      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockTicketCompleted,
      );

      mockResponsePdfsService.pdfRequestBucket.mockResolvedValue({
        fileName: 'file.pdf',
        url: 'http://url.com',
      });

      const result = await service.create(mockCreateDto, mockUser);

      expect(result).toEqual(mockTicketCompleted);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ticket.created',
        mockTicketCompleted,
      );
      expect(mockTransactionManager.create).toHaveBeenCalledWith(Ticket, {
        description: 'Test issue',
        affected_name: 'Name',
        contact_email: 'test@email.com',
        available_hours: '10-12',
        equipment_location: 'CC',
        priority: 1,
        folio: 'SYS-001',
        ot_folio: 'OT-2026-0001-CC',
        issue_type: { id: 1 },
        school_period: { id: 'period-1' },
        jefe_depto: { id: 'staff-1' },
      });
      expect(mockTransactionManager.create).toHaveBeenCalledWith(Document, {
        name: 'file.pdf',
        url: 'http://url.com',
        ticket: mockSavedTicket,
        type_document: { id: 1 },
      });
    });

    it('debería lanzar BadRequestException si el departamento está inactivo', async () => {
      const mockStaff = {
        id: 'staff-1',
        department: { id: 'dept-1', name: 'Sistemas', status: false },
      } as Staff;

      mockUsersService.findOne.mockResolvedValue({ staff: mockStaff });

      await expect(service.create(mockCreateDto, mockUser)).rejects.toThrow(
        new BadRequestException('errors.tickets.department_inactive'),
      );
    });

    it('debería lanzar ServiceUnavailableException si falla la generación del PDF', async () => {
      const mockStaff = {
        id: 'staff-1',
        department: { id: 'dept-1', acronym: 'SYS', priority: 1, status: true },
      } as Staff;

      mockUsersService.findOne.mockResolvedValue({ staff: mockStaff });
      mockIssueTypeService.findOneOrFail.mockResolvedValue({});
      mockSchoolPeriodsService.getActiveSchoolPeriodOrFail.mockResolvedValue({
        id: 'period-1',
        name: '2023-2024',
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });
      mockFolioCountersService.generateDepartmentTicketFolio.mockResolvedValue(
        'SYS-001',
      );

      const mockSavedTicket = { id: 'ticket-uuid' } as Ticket;
      mockTransactionManager.save.mockResolvedValue(mockSavedTicket);

      const mockTicketCompleted = { id: 'ticket-uuid' } as Ticket;
      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockTicketCompleted,
      );

      mockResponsePdfsService.pdfRequestBucket.mockRejectedValue(
        new Error('PDF error'),
      );

      await expect(service.create(mockCreateDto, mockUser)).rejects.toThrow(
        new ServiceUnavailableException('errors.tickets.pdf_generation_failed'),
      );
    });
  });

  describe('createOnBehalf', () => {
    it('debería crear un ticket a nombre de otro usuario exitosamente', async () => {
      const mockDto = {
        user_id: 'user-2',
        issue_type: 2,
        description: 'Test behalf',
        affected_name: 'Name 2',
        contact_email: 'test2@email.com',
        available_hours: '12-14',
        equipment_location: 'CC2',
      } as CreateTicketOnBehalfDto;

      const mockStaff = {
        id: 'staff-2',
        department: { id: 'dept-2', acronym: 'HR', priority: 2, status: true },
      } as Staff;

      mockUsersService.findOne.mockResolvedValue({ staff: mockStaff });
      mockIssueTypeService.findOneOrFail.mockResolvedValue({});
      mockSchoolPeriodsService.getActiveSchoolPeriodOrFail.mockResolvedValue({
        id: 'period-1',
        name: '2023-2024',
      });
      mockTicketHistoryService.findStatusByCodeOrFail.mockResolvedValue({
        id: 'status-uuid',
      });
      mockFolioCountersService.generateDepartmentTicketFolio.mockResolvedValue(
        'HR-001',
      );

      const mockSavedTicket = { id: 'ticket-uuid' } as Ticket;
      mockTransactionManager.save.mockResolvedValue(mockSavedTicket);

      const mockTicketCompleted = {
        id: 'ticket-uuid',
        behalf: true,
      } as unknown as Ticket;
      mockTicketsService.findOneByIdWithDetailsOrFail.mockResolvedValue(
        mockTicketCompleted,
      );

      mockResponsePdfsService.pdfRequestBucket.mockResolvedValue({
        fileName: 'file.pdf',
        url: 'http://url.com',
      });

      const mockCreator = {
        id: 'creator-1',
        role: { name: ValidRole.secretaria },
      } as User;

      const result = await service.createOnBehalf(mockDto, mockCreator);

      expect(result).toEqual({ ...mockTicketCompleted, routingFailed: false });
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-2');
      expect(mockTransactionManager.create).toHaveBeenCalledWith(Ticket, {
        description: 'Test behalf',
        affected_name: 'Name 2',
        contact_email: 'test2@email.com',
        available_hours: '12-14',
        equipment_location: 'CC2',
        priority: 2,
        folio: 'HR-001',
        ot_folio: 'OT-2026-0001-CC',
        issue_type: { id: 2 },
        school_period: { id: 'period-1' },
        jefe_depto: { id: 'staff-2' },
      });
    });
  });
});
