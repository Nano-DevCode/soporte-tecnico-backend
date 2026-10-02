import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalReportsKnowledgeBaseService } from './technical-reports-knowledge-base.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ticket } from 'src/tickets/entities/ticket.entity';

describe('TechnicalReportsKnowledgeBaseService', () => {
  let service: TechnicalReportsKnowledgeBaseService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockTicketRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicalReportsKnowledgeBaseService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: mockTicketRepo,
        },
      ],
    }).compile();

    service = module.get<TechnicalReportsKnowledgeBaseService>(
      TechnicalReportsKnowledgeBaseService,
    );
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('searchKnowledgeBase', () => {
    it('debe buscar sin texto y retornar resultados paginados ordenados por fecha', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getRawMany.mockResolvedValue([{ id: 'ticket-1' }]);

      const mockTicket = {
        id: 'ticket-1',
        issue_type: { name: 'Hardware' },
        technical_reports: [{ id: 'tr-1' }],
      } as unknown as Ticket;
      mockQueryBuilder.getMany.mockResolvedValue([mockTicket]);

      const result = await service.searchKnowledgeBase({
        limit: 10,
        page: 1,
      });

      expect(mockTicketRepo.createQueryBuilder).toHaveBeenCalledWith('ticket');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'ticket.created_at',
        'DESC',
      );
      expect(result.data).toEqual([mockTicket]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('debe buscar con texto utilizando tsvector y ranking', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getRawMany.mockResolvedValue([{ id: 'ticket-2' }]);

      const mockTicket = {
        id: 'ticket-2',
        issue_type: { name: 'Software' },
        technical_reports: [{ id: 'tr-2' }],
      } as unknown as Ticket;
      mockQueryBuilder.getMany.mockResolvedValue([mockTicket]);

      const result = await service.searchKnowledgeBase({
        limit: 5,
        page: 1,
        search: 'pantalla azul',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('websearch_to_tsquery'),
        { search: 'pantalla azul' },
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        expect.stringContaining('MAX(ts_rank_cd'),
        'search_rank',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'search_rank',
        'DESC',
      );
      expect(result.data).toEqual([mockTicket]);
    });

    it('debe retornar lista vacía si getRawMany no devuelve tickets', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.searchKnowledgeBase({
        limit: 10,
        page: 1,
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });
});
