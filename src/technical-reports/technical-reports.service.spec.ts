import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalReportsService } from './technical-reports.service';
import { TechnicalReportsCrudService } from './services/technical-reports-crud.service';
import { TechnicalReportsKnowledgeBaseService } from './services/technical-reports-knowledge-base.service';
import { CreateTechnicalReportDto } from './dto/create-technical-report.dto';
import { UpdateTechnicalReportDto } from './dto/update-technical-report.dto';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { TechnicalReport } from './entities/technical-report.entity';
import { EntityManager } from 'typeorm';

describe('TechnicalReportsService', () => {
  let service: TechnicalReportsService;

  const mockCrudService = {
    create: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneMapped: jest.fn(),
    findAllByTicketId: jest.fn(),
    update: jest.fn(),
  };

  const mockKnowledgeBaseService = {
    searchKnowledgeBase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicalReportsService,
        {
          provide: TechnicalReportsCrudService,
          useValue: mockCrudService,
        },
        {
          provide: TechnicalReportsKnowledgeBaseService,
          useValue: mockKnowledgeBaseService,
        },
      ],
    }).compile();

    service = module.get<TechnicalReportsService>(TechnicalReportsService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('create debe delegar a crudService.create', async () => {
    const dto: CreateTechnicalReportDto = {
      ticketId: 't-1',
      diagnosis: 'diag',
      work_performed: 'work',
      is_resolved: true,
    };
    const manager = {} as unknown as EntityManager;
    const expected = { id: 'tr-1' } as unknown as TechnicalReport;
    mockCrudService.create.mockResolvedValue(expected);

    const result = await service.create(dto, manager);

    expect(mockCrudService.create).toHaveBeenCalledWith(dto, manager);
    expect(result).toEqual(expected);
  });

  it('searchKnowledgeBase debe delegar a knowledgeBaseService.searchKnowledgeBase', async () => {
    const paginationDto: PaginationWithPageDto = { page: 1, limit: 10 };
    const expected = {
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
    mockKnowledgeBaseService.searchKnowledgeBase.mockResolvedValue(expected);

    const result = await service.searchKnowledgeBase(paginationDto);

    expect(mockKnowledgeBaseService.searchKnowledgeBase).toHaveBeenCalledWith(
      paginationDto,
    );
    expect(result.data).toEqual([]);
  });

  it('findOneOrFail debe delegar a crudService.findOneOrFail', async () => {
    const expected = { id: 'tr-1' } as unknown as TechnicalReport;
    mockCrudService.findOneOrFail.mockResolvedValue(expected);

    const result = await service.findOneOrFail('tr-1');

    expect(mockCrudService.findOneOrFail).toHaveBeenCalledWith('tr-1');
    expect(result).toEqual(expected);
  });

  it('findOneMapped debe delegar a crudService.findOneMapped', async () => {
    const expected = { id: 'tr-1' } as unknown as ReturnType<
      TechnicalReportsCrudService['findOneMapped']
    >;
    mockCrudService.findOneMapped.mockResolvedValue(expected);

    const result = await service.findOneMapped('tr-1');

    expect(mockCrudService.findOneMapped).toHaveBeenCalledWith('tr-1');
    expect(result).toEqual(expected);
  });

  it('findAllByTicketId debe delegar a crudService.findAllByTicketId', async () => {
    const expected = [{ id: 'tr-1' }] as unknown as ReturnType<
      TechnicalReportsCrudService['findAllByTicketId']
    >;
    mockCrudService.findAllByTicketId.mockResolvedValue(expected);

    const result = await service.findAllByTicketId('ticket-1');

    expect(mockCrudService.findAllByTicketId).toHaveBeenCalledWith('ticket-1');
    expect(result).toEqual(expected);
  });

  it('update debe delegar a crudService.update', async () => {
    const dto: UpdateTechnicalReportDto = { diagnosis: 'nuevo' };
    const expected = {
      id: 'tr-1',
      diagnosis: 'nuevo',
    } as unknown as TechnicalReport;
    mockCrudService.update.mockResolvedValue(expected);

    const result = await service.update('tr-1', dto);

    expect(mockCrudService.update).toHaveBeenCalledWith('tr-1', dto);
    expect(result).toEqual(expected);
  });
});
