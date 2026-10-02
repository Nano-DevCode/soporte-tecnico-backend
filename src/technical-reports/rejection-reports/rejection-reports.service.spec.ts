import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { RejectionReportsService } from './rejection-reports.service';
import { RejectionReport } from './entities/rejection-report.entity';
import { CreateRejectionReportDto } from './dto/create-rejection-report.dto';

import { Ticket } from 'src/tickets/entities/ticket.entity';

describe('RejectionReportsService', () => {
  let service: RejectionReportsService;

  const mockRejectionReport: RejectionReport = {
    id: 'reject-uuid-1',
    justification: 'Información insuficiente para atender el requerimiento',
    created_at: new Date(),
    updated_at: new Date(),
    ticket: { id: 'ticket-uuid-1' } as unknown as Ticket,
  };

  const mockRepo = {
    findOne: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RejectionReportsService,
        {
          provide: getRepositoryToken(RejectionReport),
          useValue: mockRepo,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<RejectionReportsService>(RejectionReportsService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateRejectionReportDto = {
      ticketId: 'ticket-uuid-1',
      justification: 'Información insuficiente para atender el requerimiento',
    };

    it('debe crear un reporte de rechazo usando el repositorio default', async () => {
      mockRepo.manager.create.mockReturnValue(mockRejectionReport);
      mockRepo.manager.save.mockResolvedValue(mockRejectionReport);

      const result = await service.create(dto);

      expect(mockRepo.manager.create).toHaveBeenCalledWith(RejectionReport, {
        justification: dto.justification,
        ticket: { id: dto.ticketId },
      });
      expect(mockRepo.manager.save).toHaveBeenCalledWith(
        RejectionReport,
        mockRejectionReport,
      );
      expect(result).toEqual(mockRejectionReport);
    });

    it('debe crear un reporte de rechazo usando el transactionManager provisto', async () => {
      const customManager = {
        create: jest.fn().mockReturnValue(mockRejectionReport),
        save: jest.fn().mockResolvedValue(mockRejectionReport),
      } as unknown as EntityManager;

      const result = await service.create(dto, customManager);

      expect(customManager.create).toHaveBeenCalledWith(RejectionReport, {
        justification: dto.justification,
        ticket: { id: dto.ticketId },
      });
      expect(customManager.save).toHaveBeenCalledWith(
        RejectionReport,
        mockRejectionReport,
      );
      expect(result).toEqual(mockRejectionReport);
    });
  });

  describe('findOneByTicketIdOrFail', () => {
    it('debe retornar el reporte si existe', async () => {
      mockRepo.findOne.mockResolvedValue(mockRejectionReport);

      const result = await service.findOneByTicketIdOrFail('ticket-uuid-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { ticket: { id: 'ticket-uuid-1' } },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockRejectionReport);
    });

    it('debe lanzar NotFoundException si no existe el reporte', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOneByTicketIdOrFail('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
