import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Status, TicketHistory } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { CreateStatusDto } from './dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TicketHistoryService {
  private readonly logger = new Logger(TicketHistoryService.name);

  constructor(
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
    @InjectRepository(TicketHistory)
    private readonly ticketHistoryRepository: Repository<TicketHistory>,
    private readonly i18n: I18nService,
  ) {}

  findAllStatus() {
    return this.statusRepository.find();
  }

  async createHistory(
    status: Status,
    ticket: Ticket,
    transactionManager?: EntityManager,
    currentHistory?: TicketHistory,
  ) {
    const manager = transactionManager || this.ticketHistoryRepository.manager;

    const ticketHistory = manager.create(TicketHistory, {
      status,
      ticket,
      created_at: new Date(),
    });

    if (currentHistory) {
      const durationInMilliseconds =
        ticketHistory.created_at.getTime() -
        currentHistory.created_at.getTime();

      currentHistory.duration = Math.floor(durationInMilliseconds / 1000);

      await manager.save(TicketHistory, currentHistory);
    }

    return manager.save(TicketHistory, ticketHistory);
  }

  async findStatusByCodeOrFail(
    code: string,
    transactionManager?: EntityManager,
  ) {
    const manager = transactionManager || this.statusRepository.manager;
    const status = await manager.findOneBy(Status, { code });
    if (!status) {
      throw new NotFoundException(
        this.i18n.t('errors.status.not_found', {
          args: { code },
        }),
      );
    }
    return status;
  }

  async createStatus(createStatusDto: CreateStatusDto) {
    const status = this.statusRepository.create(createStatusDto);
    await this.statusRepository.save(status);
    return status;
  }

  // ! Para el seeder
  async deleteAllStatus() {
    await this.statusRepository.query(
      'TRUNCATE TABLE "status" RESTART IDENTITY CASCADE',
    );
  }
}
