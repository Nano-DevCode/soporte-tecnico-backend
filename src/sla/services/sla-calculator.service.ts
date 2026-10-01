import { Injectable } from '@nestjs/common';
import {
  LimitResolutionTime,
  TicketPriorityLevel,
} from 'src/config/params.config';
import { SlaStatus } from '../entities/ticket-sla.entity';

export interface SlaProgressResult {
  elapsedHours: number;
  remainingHours: number;
  percentageConsumed: number;
  isAtRisk: boolean;
  isBreached: boolean;
  status: SlaStatus;
  deadline: Date;
}

export const LimitResponseTime: Record<number, number> = {
  [TicketPriorityLevel.CRITIC]: 2,
  [TicketPriorityLevel.HIGH]: 4,
  [TicketPriorityLevel.MEDIUM]: 8,
  [TicketPriorityLevel.LOW]: 16,
};

export const PriorityLabels: Record<number, string> = {
  [TicketPriorityLevel.CRITIC]: 'Crítica',
  [TicketPriorityLevel.HIGH]: 'Alta',
  [TicketPriorityLevel.MEDIUM]: 'Media',
  [TicketPriorityLevel.LOW]: 'Baja',
};

@Injectable()
export class SlaCalculatorService {
  readonly warningThresholdPercentage = 75;

  getMaxResolutionHours(priority: number): number {
    return (
      LimitResolutionTime[priority as keyof typeof LimitResolutionTime] ??
      LimitResolutionTime[TicketPriorityLevel.LOW]
    );
  }

  getMaxResponseHours(priority: number): number {
    return (
      LimitResponseTime[priority] ?? LimitResponseTime[TicketPriorityLevel.LOW]
    );
  }

  getPriorityLabel(priority: number): string {
    return PriorityLabels[priority] ?? 'Normal';
  }

  calculateDeadline(startDate: Date, hours: number): Date {
    const deadlineMs = new Date(startDate).getTime() + hours * 3600 * 1000;
    return new Date(deadlineMs);
  }

  calculateProgress(
    startDate: Date,
    maxHours: number,
    now: Date = new Date(),
  ): SlaProgressResult {
    const startMs = new Date(startDate).getTime();
    const currentMs = new Date(now).getTime();
    const elapsedMs = Math.max(0, currentMs - startMs);

    const elapsedHours = Number((elapsedMs / (3600 * 1000)).toFixed(2));
    const rawRemaining = maxHours - elapsedHours;
    const remainingHours = Number(Math.max(0, rawRemaining).toFixed(2));

    const percentageConsumed =
      maxHours > 0 ? Number(((elapsedHours / maxHours) * 100).toFixed(2)) : 100;

    const deadline = this.calculateDeadline(startDate, maxHours);

    let status: SlaStatus;
    let isBreached = false;
    let isAtRisk = false;

    if (percentageConsumed >= 100) {
      status = SlaStatus.BREACHED;
      isBreached = true;
    } else if (percentageConsumed >= this.warningThresholdPercentage) {
      status = SlaStatus.AT_RISK;
      isAtRisk = true;
    } else {
      status = SlaStatus.ON_TRACK;
    }

    return {
      elapsedHours,
      remainingHours,
      percentageConsumed,
      isAtRisk,
      isBreached,
      status,
      deadline,
    };
  }
}
