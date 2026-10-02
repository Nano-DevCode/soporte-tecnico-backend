import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { TechnicalReport } from '../entities/technical-report.entity';
import { CreateTechnicalReportDto } from '../dto/create-technical-report.dto';
import { UpdateTechnicalReportDto } from '../dto/update-technical-report.dto';
import { mapEquipmentToDto } from 'src/common/mappers/equipment.mapper';

@Injectable()
export class TechnicalReportsCrudService {
  constructor(
    @InjectRepository(TechnicalReport)
    private readonly technicalReportRepository: Repository<TechnicalReport>,
    private readonly i18n: I18nService,
  ) {}

  create(
    {
      ticketId,
      equipment_ids,
      fault_validity_id,
      ...createTechnicalReportDto
    }: CreateTechnicalReportDto,
    transactionManager?: EntityManager,
  ) {
    const manager =
      transactionManager || this.technicalReportRepository.manager;

    const equipmentsRelations = equipment_ids?.map((id) => ({ id })) || [];

    const technicalReport = manager.create(TechnicalReport, {
      ...createTechnicalReportDto,
      ticket: { id: ticketId },
      equipments: equipmentsRelations,
      fault_validity: { id: fault_validity_id },
    });
    return manager.save(technicalReport);
  }

  async findOneOrFail(id: string): Promise<TechnicalReport> {
    const technicalReport = await this.technicalReportRepository.findOne({
      where: { id },
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

    if (!technicalReport) {
      throw new NotFoundException(
        this.i18n.t('errors.technical_reports.not_found', { args: { id } }),
      );
    }

    return technicalReport;
  }

  async findOneMapped(id: string) {
    const technicalReport = await this.findOneOrFail(id);

    return {
      ...technicalReport,
      equipments: technicalReport.equipments.map((eq) => mapEquipmentToDto(eq)),
    };
  }

  async findAllByTicketId(id: string) {
    const reports = await this.technicalReportRepository.find({
      where: { ticket: { id } },
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

    return reports.map((report) => ({
      ...report,
      equipments: report.equipments.map((eq) => mapEquipmentToDto(eq)),
    }));
  }

  async update(
    id: string,
    { equipment_ids, fault_validity_id, ...restData }: UpdateTechnicalReportDto,
  ) {
    const preloadedReport = await this.technicalReportRepository.preload({
      id,
      ...restData,
      ...(equipment_ids !== undefined && {
        equipments: equipment_ids.map((eqId) => ({ id: eqId })),
      }),
      ...(fault_validity_id !== undefined && {
        fault_validity: { id: fault_validity_id },
      }),
    });

    if (!preloadedReport) {
      throw new NotFoundException(
        this.i18n.t('errors.technical_reports.not_found', { args: { id } }),
      );
    }

    return await this.technicalReportRepository.save(preloadedReport);
  }
}
