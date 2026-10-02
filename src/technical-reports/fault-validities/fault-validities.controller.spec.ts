import { Test, TestingModule } from '@nestjs/testing';
import { FaultValiditiesController } from './fault-validities.controller';
import { FaultValiditiesService } from './fault-validities.service';
import { I18nService } from 'nestjs-i18n';
import { FaultValidity } from './entities/fault-validity.entity';
import { CreateFaultValidityDto } from './dto/create-fault-validity.dto';

describe('FaultValiditiesController', () => {
  let controller: FaultValiditiesController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    deleteAll: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn().mockImplementation((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaultValiditiesController],
      providers: [
        {
          provide: FaultValiditiesService,
          useValue: mockService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<FaultValiditiesController>(
      FaultValiditiesController,
    );
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('create debe llamar a service.create', async () => {
    const dto: CreateFaultValidityDto = { name: 'Falla' };
    const expected = { id: 'fv-1', ...dto } as unknown as FaultValidity;
    mockService.create.mockResolvedValue(expected);

    const result = await controller.create(dto);

    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('findAll debe llamar a service.findAll', async () => {
    const expected = [{ id: 'fv-1' }] as unknown as FaultValidity[];
    mockService.findAll.mockResolvedValue(expected);

    const result = await controller.findAll();

    expect(mockService.findAll).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });
});
