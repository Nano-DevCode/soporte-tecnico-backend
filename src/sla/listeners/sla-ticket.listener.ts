import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { SlaStatus, TicketSla } from '../entities/ticket-sla.entity';
import { SlaCalculatorService } from '../services/sla-calculator.service';

@Injectable()
export class SlaTicketListener {
  private readonly logger = new Logger(SlaTicketListener.name);

  constructor(
    @InjectRepository(TicketSla)
    private readonly ticketSlaRepository: Repository<TicketSla>,
    private readonly slaCalculator: SlaCalculatorService,
  ) {}

  @OnEvent('ticket.created', { async: true })
  async handleTicketCreated(ticket: Ticket): Promise<void> {
    if (!ticket || !ticket.id) return;

    try {
      const priority = ticket.priority || 4;
      const maxHours = this.slaCalculator.getMaxResolutionHours(priority);
      const maxResponseHours = this.slaCalculator.getMaxResponseHours(priority);

      const existing = await this.ticketSlaRepository.findOne({
        where: { ticketId: ticket.id },
      });

      if (!existing) {
        const sla = this.ticketSlaRepository.create({
          ticketId: ticket.id,
          priority,
          maxResolutionHours: maxHours,
          maxResponseHours,
          slaStatus: SlaStatus.ON_TRACK,
          percentageConsumed: 0,
        });
        await this.ticketSlaRepository.save(sla);
        this.logger.debug(
          `Seguimiento de SLA inicializado para ticket ${ticket.id} (${ticket.folio})`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al inicializar SLA para ticket creado ${ticket.id}:`,
        error,
      );
    }
  }

  @OnEvent('ticket.started', { async: true })
  async handleTicketStarted(ticket: Ticket): Promise<void> {
    if (!ticket || !ticket.id) return;

    try {
      const sla = await this.ticketSlaRepository.findOne({
        where: { ticketId: ticket.id },
      });

      if (sla && !sla.firstRespondedAt) {
        sla.firstRespondedAt = new Date();
        await this.ticketSlaRepository.save(sla);
        this.logger.debug(
          `Primera respuesta registrada en SLA para ticket ${ticket.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al registrar primera respuesta de SLA para ticket ${ticket.id}:`,
        error,
      );
    }
  }

  @OnEvent('ticket.solved', { async: true })
  @OnEvent('ticket.finished', { async: true })
  @OnEvent('ticket.closed', { async: true })
  async handleTicketResolved(ticket: Ticket): Promise<void> {
    if (!ticket || !ticket.id) return;

    try {
      const sla = await this.ticketSlaRepository.findOne({
        where: { ticketId: ticket.id },
      });

      if (sla && !sla.resolvedAt) {
        const now = new Date();
        sla.resolvedAt = now;

        const progress = this.slaCalculator.calculateProgress(
          ticket.created_at || sla.createdAt,
          sla.maxResolutionHours,
          now,
        );

        sla.percentageConsumed = progress.percentageConsumed;
        sla.slaStatus = progress.isBreached
          ? SlaStatus.BREACHED
          : SlaStatus.COMPLIANT;

        await this.ticketSlaRepository.save(sla);
        this.logger.debug(
          `SLA finalizado para ticket ${ticket.id}: ${sla.slaStatus} (${progress.percentageConsumed}%)`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al finalizar SLA para ticket resuelto ${ticket.id}:`,
        error,
      );
    }
  }
}
