import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalReportsCrudService } from './technical-reports-crud.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TechnicalReport } from '../entities/technical-report.entity';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateTechnicalReportDto } from '../dto/create-technical-report.dto';
import { UpdateTechnicalReportDto } from '../dto/update-technical-report.dto';

describe('TechnicalReportsCrudService', () => {
  let service: TechnicalReportsCrudService;

  const mockRepo = {
    manager: {
      create: jest.fn(),
      save: jest.fn(),
    },
    findOne: jest.fn(),
    find: jest.fn(),
    preload: jest.fn(),
    save: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn((key: string) => key),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicalReportsCrudService,
        {
          provide: getRepositoryToken(TechnicalReport),
          useValue: mockRepo,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<TechnicalReportsCrudService>(
      TechnicalReportsCrudService,
    );
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y guardar un reporte técnico usando el repo manager por defecto', async () => {
      const dto: CreateTechnicalReportDto = {
        ticketId: 'ticket-1',
        diagnosis: 'Pantalla rota',
        work_performed: 'Cambio de display',
        is_resolved: true,
        equipment_ids: ['eq-1', 'eq-2'],
        fault_validity_id: 'fv-1',
      };
      const createdEntity = {
        id: 'report-1',
        ...dto,
      } as unknown as TechnicalReport;

      mockRepo.manager.create.mockReturnValue(createdEntity);
      mockRepo.manager.save.mockResolvedValue(createdEntity);

      const result = await service.create(dto);

      expect(mockRepo.manager.create).toHaveBeenCalledWith(TechnicalReport, {
        diagnosis: 'Pantalla rota',
        work_performed: 'Cambio de display',
        is_resolved: true,
        ticket: { id: 'ticket-1' },
        equipments: [{ id: 'eq-1' }, { id: 'eq-2' }],
        fault_validity: { id: 'fv-1' },
      });
      expect(mockRepo.manager.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toEqual(createdEntity);
    });

    it('debe usar el transactionManager si se proporciona', async () => {
      const customManager = {
        create: jest.fn().mockReturnValue({ id: 'report-custom' }),
        save: jest.fn().mockResolvedValue({ id: 'report-custom' }),
      } as unknown as EntityManager;

      const dto: CreateTechnicalReportDto = {
        ticketId: 'ticket-2',
        diagnosis: 'Fallo disco',
        work_performed: 'Reemplazo SSD',
        is_resolved: true,
      };

      const result = await service.create(dto, customManager);

      expect(customManager.create).toHaveBeenCalled();
      expect(customManager.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'report-custom' });
    });
  });

  describe('findOneOrFail', () => {
    it('debe retornar el reporte técnico si existe', async () => {
      const mockReport = {
        id: 'report-1',
        diagnosis: 'Falla',
        fault_validity: { id: 'fv-1' },
        equipments: [],
      } as unknown as TechnicalReport;
      mockRepo.findOne.mockResolvedValue(mockReport);

      const result = await service.findOneOrFail('report-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        relations: {
          fault_validity: true,
          equipments: {
            id_type_equipment: true,
            id_model: {
              id_brand: true,
            },
            id_responsable: true,
            id_departament: true,
          },
        },
      });
      expect(result).toEqual(mockReport);
    });

    it('debe lanzar NotFoundException si no existe el reporte', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneOrFail('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockI18n.t).toHaveBeenCalledWith(
        'errors.technical_reports.not_found',
        { args: { id: 'non-existent' } },
      );
    });
  });

  describe('findOneMapped', () => {
    it('debe retornar el reporte con equipos mapeados', async () => {
      const mockReport = {
        id: 'report-1',
        diagnosis: 'Falla',
        fault_validity: { id: 'fv-1' },
        equipments: [
          {
            id: 'eq-1',
            num_inventario: 'INV-123',
            serial_number: 'SN-123',
            created_at: new Date(),
            updated_at: new Date(),
            id_type_equipment: { id: 't-1', name: 'Laptop' },
            id_model: {
              id: 'm-1',
              name: 'ThinkPad',
              id_brand: { id: 'b-1', name: 'Lenovo' },
            },
            id_responsable: { id: 'r-1', name: 'Juan', last_name: 'Perez' },
            id_departament: { id: 'd-1', name: 'TI' },
          },
        ],
      } as unknown as TechnicalReport;
      mockRepo.findOne.mockResolvedValue(mockReport);

      const result = await service.findOneMapped('report-1');

      expect(result.id).toBe('report-1');
      expect(result.equipments).toHaveLength(1);
      expect(result.equipments[0].type).toBe('Laptop');
    });
  });

  describe('findAllByTicketId', () => {
    it('debe retornar lista de reportes mapeados para el ticket dado', async () => {
      const mockReports = [
        {
          id: 'report-1',
          ticket: { id: 'ticket-1' },
          equipments: [],
        },
      ] as unknown as TechnicalReport[];
      mockRepo.find.mockResolvedValue(mockReports);

      const result = await service.findAllByTicketId('ticket-1');

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { ticket: { id: 'ticket-1' } },
        order: { created_at: 'DESC' },
        relations: {
          fault_validity: true,
          equipments: {
            id_type_equipment: true,
            id_model: {
              id_brand: true,
            },
            id_responsable: true,
            id_departament: true,
          },
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('report-1');
    });
  });

  describe('update', () => {
    it('debe actualizar y guardar el reporte si se encuentra', async () => {
      const dto: UpdateTechnicalReportDto = {
        diagnosis: 'Diagnóstico actualizado',
        equipment_ids: ['eq-3'],
        fault_validity_id: 'fv-2',
      };
      const preloaded = {
        id: 'report-1',
        diagnosis: 'Diagnóstico actualizado',
        equipments: [{ id: 'eq-3' }],
        fault_validity: { id: 'fv-2' },
      } as unknown as TechnicalReport;

      mockRepo.preload.mockResolvedValue(preloaded);
      mockRepo.save.mockResolvedValue(preloaded);

      const result = await service.update('report-1', dto);

      expect(mockRepo.preload).toHaveBeenCalledWith({
        id: 'report-1',
        diagnosis: 'Diagnóstico actualizado',
        equipments: [{ id: 'eq-3' }],
        fault_validity: { id: 'fv-2' },
      });
      expect(mockRepo.save).toHaveBeenCalledWith(preloaded);
      expect(result).toEqual(preloaded);
    });

    it('debe lanzar NotFoundException si preload retorna null', async () => {
      mockRepo.preload.mockResolvedValue(null);

      await expect(
        service.update('missing', { diagnosis: 'algo' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockI18n.t).toHaveBeenCalledWith(
        'errors.technical_reports.not_found',
        { args: { id: 'missing' } },
      );
    });
  });
});
