import { BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

export enum TicketStatus {
  IDLE = 'IDLE',
  RECIBIDA = 'RECIBIDA',
  RECHAZADA = 'RECHAZADA',
  CANALIZADA = 'CANALIZADA',
  ASIGNADA = 'ASIGNADA',
  ATENDIENDO = 'ATENDIENDO',
  SOLUCIONADA = 'SOLUCIONADA',
  NO_SOLUCIONADA = 'NO_SOLUCIONADA',
  FINALIZADA = 'FINALIZADA',
  CERRADA = 'CERRADA',
  ARCHIVADA = 'ARCHIVADA',
}

export enum TicketEvent {
  RECIBIR = 'RECIBIR',
  CORREGIR = 'CORREGIR',
  RECHAZAR = 'RECHAZAR',
  CANALIZAR = 'CANALIZAR',
  ASIGNAR = 'ASIGNAR',
  ATENDER = 'ATENDER',
  SOLUCIONAR = 'SOLUCIONAR',
  NO_SOLUCIONAR = 'NO_SOLUCIONAR',
  PAUSAR = 'PAUSAR',
  FINALIZAR = 'FINALIZAR',
  CERRAR = 'CERRAR',
  ARCHIVAR = 'ARCHIVAR',
}

export const machine: Record<
  TicketStatus,
  Partial<Record<TicketEvent, TicketStatus>>
> = {
  [TicketStatus.IDLE]: {
    [TicketEvent.RECIBIR]: TicketStatus.RECIBIDA,
  },
  [TicketStatus.RECIBIDA]: {
    [TicketEvent.RECHAZAR]: TicketStatus.RECHAZADA,
    [TicketEvent.CANALIZAR]: TicketStatus.CANALIZADA,
    [TicketEvent.CORREGIR]: TicketStatus.RECIBIDA,
  },
  [TicketStatus.RECHAZADA]: {
    [TicketEvent.CORREGIR]: TicketStatus.RECIBIDA,
  },
  [TicketStatus.CANALIZADA]: {
    [TicketEvent.ASIGNAR]: TicketStatus.ASIGNADA,
    [TicketEvent.CANALIZAR]: TicketStatus.CANALIZADA,
  },
  [TicketStatus.ASIGNADA]: {
    [TicketEvent.ATENDER]: TicketStatus.ATENDIENDO,
    [TicketEvent.ASIGNAR]: TicketStatus.ASIGNADA,
  },
  [TicketStatus.ATENDIENDO]: {
    [TicketEvent.SOLUCIONAR]: TicketStatus.SOLUCIONADA,
    [TicketEvent.NO_SOLUCIONAR]: TicketStatus.NO_SOLUCIONADA,
    [TicketEvent.FINALIZAR]: TicketStatus.FINALIZADA,
  },
  [TicketStatus.SOLUCIONADA]: {
    [TicketEvent.FINALIZAR]: TicketStatus.FINALIZADA,
  },
  [TicketStatus.NO_SOLUCIONADA]: {
    [TicketEvent.ASIGNAR]: TicketStatus.ASIGNADA,
    [TicketEvent.FINALIZAR]: TicketStatus.FINALIZADA,
    [TicketEvent.CANALIZAR]: TicketStatus.CANALIZADA,
  },
  [TicketStatus.FINALIZADA]: {
    [TicketEvent.CERRAR]: TicketStatus.CERRADA,
  },
  [TicketStatus.CERRADA]: {
    [TicketEvent.ARCHIVAR]: TicketStatus.ARCHIVADA,
  },
  [TicketStatus.ARCHIVADA]: {},
};

export const transition = (
  currentState: TicketStatus,
  event: TicketEvent,
  i18n: I18nService,
): TicketStatus => {
  const stateConfig = machine[currentState];
  if (!stateConfig) {
    throw new BadRequestException(
      i18n.t('errors.ticket_machine.invalid_state', {
        args: { state: currentState },
      }),
    );
  }

  const nextState = stateConfig[event];
  if (!nextState) {
    throw new BadRequestException(
      i18n.t('errors.ticket_machine.invalid_transition', {
        args: { event, state: currentState },
      }),
    );
  }

  return nextState;
};
