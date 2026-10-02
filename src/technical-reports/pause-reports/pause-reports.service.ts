import { Injectable } from '@nestjs/common';
import { CreatePauseReportDto } from './dto/create-pause-report.dto';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PauseReport } from './entities/pause-report.entity';

@Injectable()
export class PauseReportsService {
  constructor(
    @InjectRepository(PauseReport)
    private readonly pauseReportRepository: Repository<PauseReport>,
  ) {}
  create(
    { ticketId, ...createPauseReportDto }: CreatePauseReportDto,
    transactionManager?: EntityManager,
  ) {
    const manager = transactionManager || this.pauseReportRepository.manager;
    const pauseReport = manager.create(PauseReport, {
      ...createPauseReportDto,
      ticket: { id: ticketId },
    });
    return manager.save(pauseReport);
  }
}
