import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRejectionReportDto } from './dto/create-rejection-report.dto';
import { EntityManager, Repository } from 'typeorm';
import { RejectionReport } from './entities/rejection-report.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class RejectionReportsService {
  constructor(
    @InjectRepository(RejectionReport)
    private readonly rejectionReportRepository: Repository<RejectionReport>,
    private readonly i18n: I18nService,
  ) {}

  async create(
    { ticketId, ...createRejectionReportDto }: CreateRejectionReportDto,
    transactionManager?: EntityManager,
  ) {
    const manager =
      transactionManager || this.rejectionReportRepository.manager;
    const rejectReport = manager.create(RejectionReport, {
      ...createRejectionReportDto,
      ticket: { id: ticketId },
    });
    return await manager.save(RejectionReport, rejectReport);
  }

  async findOneByTicketIdOrFail(id: string): Promise<RejectionReport> {
    const report = await this.rejectionReportRepository.findOne({
      where: {
        ticket: { id: id },
      },
      order: {
        created_at: 'DESC',
      },
    });

    if (!report) {
      throw new NotFoundException(
        this.i18n.t('errors.rejection_reports.not_found', {
          args: { id },
        }),
      );
    }

    return report;
  }
}
