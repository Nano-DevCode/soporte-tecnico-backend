export const TicketPriorityLevel = {
  CRITIC: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
} as const;

export const criticalAvailabilityGoal = 99.0;
export const firstLevelResolutionGoal = 70.0;
export const SLAComplianceGoal = 90.0;
export const preventiveMaintanenceGoal = 100;
export const costPerIncidentGoal = 500;
export const userSatisfaccionGoal = 85.0;

export const START_OPERATION_DATE: Date = new Date('2026-02-01');

export const LimitResolutionTime = {
  [TicketPriorityLevel.CRITIC]: 12,
  [TicketPriorityLevel.HIGH]: 24,
  [TicketPriorityLevel.MEDIUM]: 36,
  [TicketPriorityLevel.LOW]: 48,
};
