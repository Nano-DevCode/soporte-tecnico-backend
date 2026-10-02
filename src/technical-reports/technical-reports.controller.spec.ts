import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalReportsController } from './technical-reports.controller';
import { TechnicalReportsService } from './technical-reports.service';
import { I18nService } from 'nestjs-i18n';
import { TechnicalReport } from './entities/technical-report.entity';
import { CreateTechnicalReportDto } from './dto/create-technical-report.dto';
import { UpdateTechnicalReportDto } from './dto/update-technical-report.dto';
import { PaginationResponse } from 'src/common/pagination/paginationResponse';

describe('TechnicalReportsController', () => {
  let controller: TechnicalReportsController;

  const mockService = {
    create: jest.fn(),
    searchKnowledgeBase: jest.fn(),
    findOneMapped: jest.fn(),
    findAllByTicketId: jest.fn(),
    update: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TechnicalReportsController],
      providers: [
        {
          provide: TechnicalReportsService,
          useValue: mockService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<TechnicalReportsController>(
      TechnicalReportsController,
    );
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('create debe llamar a technicalReportsService.create', async () => {
    const dto: CreateTechnicalReportDto = {
      ticketId: 't-1',
      diagnosis: 'diag',
      work_performed: 'work',
      is_resolved: true,
    };
    const expected = { id: 'tr-1', ...dto } as unknown as TechnicalReport;
    mockService.create.mockResolvedValue(expected);

    const result = await controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('findAll debe llamar a technicalReportsService.searchKnowledgeBase', async () => {
    const query = { page: 1, limit: 10 };
    const expected = PaginationResponse({ data: [], total: 0 }, query);
    mockService.searchKnowledgeBase.mockResolvedValue(expected);

    const result = await controller.findAll(query);

    expect(mockService.searchKnowledgeBase).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });

  it('findAllByTicketId debe llamar a technicalReportsService.findAllByTicketId', async () => {
    const expected = [{ id: 'tr-1' }] as unknown as ReturnType<
      TechnicalReportsService['findAllByTicketId']
    >;
    mockService.findAllByTicketId.mockResolvedValue(expected);

    const result = await controller.findAllByTicketId('ticket-1');

    expect(mockService.findAllByTicketId).toHaveBeenCalledWith('ticket-1');
    expect(result).toEqual(expected);
  });

  it('findOne debe llamar a technicalReportsService.findOneMapped', async () => {
    const expected = { id: 'tr-1' } as unknown as ReturnType<
      TechnicalReportsService['findOneMapped']
    >;
    mockService.findOneMapped.mockResolvedValue(expected);

    const result = await controller.findOne('tr-1');

    expect(mockService.findOneMapped).toHaveBeenCalledWith('tr-1');
    expect(result).toEqual(expected);
  });

  it('update debe llamar a technicalReportsService.update', async () => {
    const dto: UpdateTechnicalReportDto = { diagnosis: 'modificado' };
    const expected = { id: 'tr-1', ...dto } as unknown as TechnicalReport;
    mockService.update.mockResolvedValue(expected);

    const result = await controller.update('tr-1', dto);

    expect(mockService.update).toHaveBeenCalledWith('tr-1', dto);
    expect(result).toEqual(expected);
  });
});
