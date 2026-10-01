import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { SlaStatus, TicketSla } from '../entities/ticket-sla.entity';
import { SlaCalculatorService } from './sla-calculator.service';
import { TelegramService } from 'src/telegram/services/telegram.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { GeneralWebsocketGateway } from 'src/general-websocket/general-websocket.gateway';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';
import {
  EvaluateSlaResponseDto,
  SlaTicketItemResponseDto,
} from '../dto/sla-ticket-item-response.dto';
import {
  SlaMetricsResponseDto,
  SlaPriorityBreakdownDto,
} from '../dto/sla-metrics-response.dto';
import { SlaTicketFilterDto } from '../dto/sla-ticket-filter.dto';

const TERMINAL_STATUSES = new Set([
  TicketStatus.SOLUCIONADA,
  TicketStatus.FINALIZADA,
  TicketStatus.CERRADA,
  TicketStatus.ARCHIVADA,
  TicketStatus.RECHAZADA,
]);

@Injectable()
export class SlaMonitorService {
  private readonly logger = new Logger(SlaMonitorService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketSla)
    private readonly ticketSlaRepository: Repository<TicketSla>,
    private readonly slaCalculator: SlaCalculatorService,
    private readonly telegramBotService: TelegramService,
    private readonly notificationsService: NotificationsService,
    private readonly websocketGateway: GeneralWebsocketGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(process.env.SLA_CHECK_CRON || '*/15 * * * *')
  async handleCronCheck(): Promise<void> {
    this.logger.log('Iniciando ciclo automático de monitoreo de SLAs...');
    try {
      const summary = await this.runSlaCheck();
      this.logger.log(
        `Ciclo SLA completado: ${summary.checked} revisados (${summary.onTrack} en tiempo, ${summary.atRisk} en riesgo, ${summary.breached} vencidos). Alertas emitidas: ${summary.warningAlertsSent} preventivas, ${summary.breachAlertsSent} críticas.`,
      );
    } catch (error) {
      this.logger.error('Error durante la ejecución del ciclo de SLA:', error);
    }
  }

  async runSlaCheck(): Promise<EvaluateSlaResponseDto> {
    const activeTickets = await this.fetchActiveTickets();

    let onTrackCount = 0;
    let atRiskCount = 0;
    let breachedCount = 0;
    let warningAlertsSent = 0;
    let breachAlertsSent = 0;

    const now = new Date();

    for (const ticket of activeTickets) {
      const priority = ticket.priority || 4;
      const maxHours = this.slaCalculator.getMaxResolutionHours(priority);
      const maxResponseHours = this.slaCalculator.getMaxResponseHours(priority);
      const progress = this.slaCalculator.calculateProgress(
        ticket.created_at,
        maxHours,
        now,
      );

      let sla = await this.ticketSlaRepository.findOne({
        where: { ticketId: ticket.id },
      });

      if (!sla) {
        sla = this.ticketSlaRepository.create({
          ticketId: ticket.id,
          priority,
          maxResolutionHours: maxHours,
          maxResponseHours,
          slaStatus: progress.status,
          percentageConsumed: progress.percentageConsumed,
        });
      } else {
        sla.priority = priority;
        sla.maxResolutionHours = maxHours;
        sla.maxResponseHours = maxResponseHours;
        sla.slaStatus = progress.status;
        sla.percentageConsumed = progress.percentageConsumed;
      }

      if (progress.status === SlaStatus.BREACHED) {
        breachedCount++;
        if (!sla.breachedAlertSentAt) {
          await this.dispatchBreachAlert(
            ticket,
            progress.elapsedHours,
            maxHours,
          );
          sla.breachedAlertSentAt = now;
          breachAlertsSent++;
        }
      } else if (progress.status === SlaStatus.AT_RISK) {
        atRiskCount++;
        if (!sla.warningAlertSentAt) {
          await this.dispatchWarningAlert(
            ticket,
            progress.elapsedHours,
            maxHours,
            progress.remainingHours,
            progress.percentageConsumed,
          );
          sla.warningAlertSentAt = now;
          warningAlertsSent++;
        }
      } else {
        onTrackCount++;
      }

      await this.ticketSlaRepository.save(sla);
    }

    return {
      checked: activeTickets.length,
      onTrack: onTrackCount,
      atRisk: atRiskCount,
      breached: breachedCount,
      warningAlertsSent,
      breachAlertsSent,
    };
  }

  async getMetrics(): Promise<SlaMetricsResponseDto> {
    const activeTickets = await this.fetchActiveTickets();
    const now = new Date();

    let onTrack = 0;
    let atRisk = 0;
    let breached = 0;

    const priorityMap: Record<
      number,
      { total: number; onTrack: number; atRisk: number; breached: number }
    > = {
      1: { total: 0, onTrack: 0, atRisk: 0, breached: 0 },
      2: { total: 0, onTrack: 0, atRisk: 0, breached: 0 },
      3: { total: 0, onTrack: 0, atRisk: 0, breached: 0 },
      4: { total: 0, onTrack: 0, atRisk: 0, breached: 0 },
    };

    for (const ticket of activeTickets) {
      const priority = ticket.priority in priorityMap ? ticket.priority : 4;
      const maxHours = this.slaCalculator.getMaxResolutionHours(priority);
      const progress = this.slaCalculator.calculateProgress(
        ticket.created_at,
        maxHours,
        now,
      );

      priorityMap[priority].total++;

      if (progress.status === SlaStatus.BREACHED) {
        breached++;
        priorityMap[priority].breached++;
      } else if (progress.status === SlaStatus.AT_RISK) {
        atRisk++;
        priorityMap[priority].atRisk++;
      } else {
        onTrack++;
        priorityMap[priority].onTrack++;
      }
    }

    const totalActive = activeTickets.length;
    const compliancePercentage =
      totalActive > 0
        ? Number((((onTrack + atRisk) / totalActive) * 100).toFixed(2))
        : 100;

    const byPriority: SlaPriorityBreakdownDto[] = [1, 2, 3, 4].map((p) => ({
      priority: p,
      label: this.slaCalculator.getPriorityLabel(p),
      total: priorityMap[p].total,
      onTrack: priorityMap[p].onTrack,
      atRisk: priorityMap[p].atRisk,
      breached: priorityMap[p].breached,
    }));

    return {
      totalActive,
      onTrack,
      atRisk,
      breached,
      compliancePercentage,
      byPriority,
    };
  }

  async getActiveTicketsWithSla(filterDto: SlaTicketFilterDto): Promise<{
    data: SlaTicketItemResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status, priority, search } = filterDto;
    const allActive = await this.fetchActiveTickets();
    const now = new Date();

    let items: SlaTicketItemResponseDto[] = allActive.map((ticket) => {
      const p = ticket.priority || 4;
      const maxHours = this.slaCalculator.getMaxResolutionHours(p);
      const progress = this.slaCalculator.calculateProgress(
        ticket.created_at,
        maxHours,
        now,
      );

      const latestHistory = this.getLatestHistory(ticket);
      const coordinatorName = ticket.coordinator
        ? `${ticket.coordinator.name} ${ticket.coordinator.paternalSurname}`.trim()
        : undefined;

      const activeTechnicians =
        ticket.attends
          ?.filter((a) => a.is_active && a.technician)
          .map((a) =>
            `${a.technician.name} ${a.technician.paternalSurname}`.trim(),
          ) ?? [];

      return {
        ticketId: ticket.id,
        folio: ticket.folio,
        priority: p,
        priorityLabel: this.slaCalculator.getPriorityLabel(p),
        status: latestHistory?.status?.code || 'UNKNOWN',
        departmentName:
          ticket.jefe_depto?.department?.name || 'No especificado',
        maxResolutionHours: maxHours,
        elapsedHours: progress.elapsedHours,
        remainingHours: progress.remainingHours,
        percentageConsumed: progress.percentageConsumed,
        slaStatus: progress.status,
        coordinatorName,
        technicians: activeTechnicians,
        createdAt: ticket.created_at.toISOString(),
        resolutionDeadline: progress.deadline.toISOString(),
      };
    });

    if (status) {
      items = items.filter((item) => item.slaStatus === status);
    }

    if (priority) {
      items = items.filter((item) => item.priority === priority);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.folio.toLowerCase().includes(searchLower) ||
          item.departmentName.toLowerCase().includes(searchLower) ||
          (item.coordinatorName &&
            item.coordinatorName.toLowerCase().includes(searchLower)),
      );
    }

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      data: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  private async fetchActiveTickets(): Promise<Ticket[]> {
    const rawTickets = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.coordinator', 'coordinator')
      .leftJoinAndSelect('coordinator.user', 'coordinator_user')
      .leftJoinAndSelect(
        'ticket.attends',
        'attends',
        'attends.is_active = :isActive',
        {
          isActive: true,
        },
      )
      .leftJoinAndSelect('attends.technician', 'technician')
      .leftJoinAndSelect('technician.user', 'technician_user')
      .leftJoinAndSelect('ticket.jefe_depto', 'jefe_depto')
      .leftJoinAndSelect('jefe_depto.department', 'department')
      .leftJoinAndSelect('ticket.ticket_histories', 'histories')
      .leftJoinAndSelect('histories.status', 'status')
      .leftJoinAndSelect('ticket.pause_report', 'pause_report')
      .where('pause_report.id IS NULL')
      .getMany();

    return rawTickets.filter((ticket) => {
      const latestHistory = this.getLatestHistory(ticket);
      const currentCode = latestHistory?.status?.code;
      if (!currentCode) return false;
      return !TERMINAL_STATUSES.has(currentCode as TicketStatus);
    });
  }

  private getLatestHistory(ticket: Ticket) {
    if (!ticket.ticket_histories || ticket.ticket_histories.length === 0) {
      return null;
    }
    return [...ticket.ticket_histories].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  }

  private async dispatchWarningAlert(
    ticket: Ticket,
    elapsedHours: number,
    maxHours: number,
    remainingHours: number,
    percentage: number,
  ): Promise<void> {
    const priorityLabel = this.slaCalculator.getPriorityLabel(ticket.priority);
    const departmentName =
      ticket.jefe_depto?.department?.name || 'No especificado';

    const message = `
⚠️ <b>ALERTA DE SLA - TICKET EN RIESGO (${percentage}%)</b>

<b>Folio:</b> ${ticket.folio}
<b>Prioridad:</b> ${priorityLabel}
<b>Departamento:</b> ${departmentName}
<b>Tiempo transcurrido:</b> ${elapsedHours}h de ${maxHours}h límite
<b>Tiempo restante estimado:</b> ${remainingHours}h

<i>Por favor atienda o asigne este ticket para evitar penalización de SLA.</i>
    `.trim();

    await this.notifyTelegramRecipients(ticket, message);
    await this.createInAppNotifications(
      ticket,
      `⚠️ SLA en Riesgo: Ticket ${ticket.folio}`,
      `El ticket ${ticket.folio} ha consumido el ${percentage}% de su tiempo límite de atención. Tiempo restante: ${remainingHours}h.`,
    );

    this.eventEmitter.emit('sla.warning', {
      ticketId: ticket.id,
      folio: ticket.folio,
      percentage,
      remainingHours,
    });
  }

  private async dispatchBreachAlert(
    ticket: Ticket,
    elapsedHours: number,
    maxHours: number,
  ): Promise<void> {
    const priorityLabel = this.slaCalculator.getPriorityLabel(ticket.priority);
    const departmentName =
      ticket.jefe_depto?.department?.name || 'No especificado';
    const excess = Number((elapsedHours - maxHours).toFixed(2));

    const message = `
🚨 <b>VIOLACIÓN DE SLA - TICKET VENCIDO</b>

<b>Folio:</b> ${ticket.folio}
<b>Prioridad:</b> ${priorityLabel}
<b>Departamento:</b> ${departmentName}
<b>Límite permitido:</b> ${maxHours}h
<b>Tiempo consumido:</b> ${elapsedHours}h
<b>Exceso:</b> +${excess}h

<i>Este ticket ha superado el acuerdo de nivel de servicio acordado. Se requiere intervención técnica inmediata.</i>
    `.trim();

    await this.notifyTelegramRecipients(ticket, message);
    await this.createInAppNotifications(
      ticket,
      `🚨 SLA Violado: Ticket ${ticket.folio}`,
      `El ticket ${ticket.folio} ha superado el tiempo límite de resolución por +${excess}h. Requiere atención inmediata.`,
    );

    this.eventEmitter.emit('sla.breached', {
      ticketId: ticket.id,
      folio: ticket.folio,
      excessHours: excess,
    });
  }

  private async notifyTelegramRecipients(
    ticket: Ticket,
    message: string,
  ): Promise<void> {
    const telegramIds = new Set<string>();

    if (ticket.coordinator?.idTelegram) {
      telegramIds.add(ticket.coordinator.idTelegram);
    }

    if (ticket.attends && ticket.attends.length > 0) {
      for (const attend of ticket.attends) {
        if (attend.is_active && attend.technician?.idTelegram) {
          telegramIds.add(attend.technician.idTelegram);
        }
      }
    }

    for (const chatId of telegramIds) {
      try {
        await this.telegramBotService.sendNotification(chatId, message);
      } catch (error) {
        this.logger.warn(
          `No se pudo enviar alerta de Telegram para el chatId ${chatId}: ${error}`,
        );
      }
    }
  }

  private async createInAppNotifications(
    ticket: Ticket,
    title: string,
    message: string,
  ): Promise<void> {
    const userIds = new Set<string>();

    if (ticket.coordinator?.user?.id) {
      userIds.add(ticket.coordinator.user.id);
    }

    if (ticket.attends && ticket.attends.length > 0) {
      for (const attend of ticket.attends) {
        if (attend.is_active && attend.technician?.user?.id) {
          userIds.add(attend.technician.user.id);
        }
      }
    }

    for (const userId of userIds) {
      try {
        const notif = await this.notificationsService.create({
          userId,
          title,
          message,
          entityId: ticket.id,
        });

        this.websocketGateway.emitToUser(userId, 'sla_alert', notif);
      } catch (error) {
        this.logger.warn(
          `Error al crear notificación in-app para usuario ${userId}: ${error}`,
        );
      }
    }
  }
}
