import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { PauseReportsService } from './pause-reports.service';
import { PauseReport } from './entities/pause-report.entity';
import { CreatePauseReportDto } from './dto/create-pause-report.dto';

import { Ticket } from 'src/tickets/entities/ticket.entity';

describe('PauseReportsService', () => {
  let service: PauseReportsService;

  const mockPauseReport: PauseReport = {
    id: 'pause-uuid-1',
    diagnosis: 'Esperando refacción',
    justification: 'Falta tarjeta madre',
    created_at: new Date(),
    updated_at: new Date(),
    ticket: { id: 'ticket-uuid-1' } as unknown as Ticket,
  };

  const mockRepo = {
    manager: {
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PauseReportsService,
        {
          provide: getRepositoryToken(PauseReport),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PauseReportsService>(PauseReportsService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreatePauseReportDto = {
      ticketId: 'ticket-uuid-1',
      diagnosis: 'Esperando refacción',
      justification: 'Falta tarjeta madre',
    };

    it('debe crear un reporte de pausa usando el repositorio default', async () => {
      mockRepo.manager.create.mockReturnValue(mockPauseReport);
      mockRepo.manager.save.mockResolvedValue(mockPauseReport);

      const result = await service.create(dto);

      expect(mockRepo.manager.create).toHaveBeenCalledWith(PauseReport, {
        diagnosis: dto.diagnosis,
        justification: dto.justification,
        ticket: { id: dto.ticketId },
      });
      expect(mockRepo.manager.save).toHaveBeenCalledWith(mockPauseReport);
      expect(result).toEqual(mockPauseReport);
    });

    it('debe crear un reporte de pausa usando el transactionManager provisto', async () => {
      const customManager = {
        create: jest.fn().mockReturnValue(mockPauseReport),
        save: jest.fn().mockResolvedValue(mockPauseReport),
      } as unknown as EntityManager;

      const result = await service.create(dto, customManager);

      expect(customManager.create).toHaveBeenCalledWith(PauseReport, {
        diagnosis: dto.diagnosis,
        justification: dto.justification,
        ticket: { id: dto.ticketId },
      });
      expect(customManager.save).toHaveBeenCalledWith(mockPauseReport);
      expect(result).toEqual(mockPauseReport);
    });
  });
});
