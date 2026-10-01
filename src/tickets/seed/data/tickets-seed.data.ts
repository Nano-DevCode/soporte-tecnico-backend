import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';

export interface SeedTicketItem {
  folio: string;
  description: string;
  affected_name: string;
  contact_email: string;
  available_hours: string;
  equipment_location: string;
  priority: number;
  statusCode: TicketStatus;
  issueTypeName: string;
  tagNames: string[];
}

export const SEED_TICKET_STATUSES = [
  { name: 'Recibida', code: TicketStatus.RECIBIDA },
  { name: 'Rechazada', code: TicketStatus.RECHAZADA },
  { name: 'Canalizada', code: TicketStatus.CANALIZADA },
  { name: 'Asignada', code: TicketStatus.ASIGNADA },
  { name: 'Atendiendo', code: TicketStatus.ATENDIENDO },
  { name: 'Solucionada', code: TicketStatus.SOLUCIONADA },
  { name: 'No Solucionada', code: TicketStatus.NO_SOLUCIONADA },
  { name: 'Finalizada', code: TicketStatus.FINALIZADA },
  { name: 'Cerrada', code: TicketStatus.CERRADA },
  { name: 'Archivada', code: TicketStatus.ARCHIVADA },
];

export const SEED_ISSUE_TYPES = [
  {
    name: 'Falla de Hardware',
    description:
      'Problemas físicos con equipos de cómputo, fuentes de poder, pantallas o periféricos.',
  },
  {
    name: 'Falla de Software',
    description:
      'Errores en sistema operativo, paquetería de oficina, antivirus o licencias.',
  },
  {
    name: 'Conectividad y Redes',
    description:
      'Fallas de cableado estructurado, configuración de red local o acceso a Internet.',
  },
  {
    name: 'Mantenimiento Preventivo',
    description:
      'Servicio programado de limpieza interna, verificación de pasta térmica y optimización.',
  },
  {
    name: 'Soporte a Impresoras',
    description:
      'Configuración de controladores, atasco de papel o conexión por red a multifuncionales.',
  },
];

export const SEED_TAGS = [
  'Urgente',
  'Laboratorio',
  'Administrativo',
  'Red',
  'Impresora',
  'Mantenimiento',
];

export const SEED_TICKETS: SeedTicketItem[] = [
  {
    folio: 'TICK-2026-0001',
    description:
      'Equipo principal de recepción no enciende tras tormenta eléctrica del fin de semana.',
    affected_name: 'Lic. Martha Domínguez Ramos',
    contact_email: 'martha.dominguez@itoaxaca.edu.mx',
    available_hours: '08:00 - 14:00',
    equipment_location: 'Edificio A - Ventanilla 2',
    priority: 3,
    statusCode: TicketStatus.RECIBIDA,
    issueTypeName: 'Falla de Hardware',
    tagNames: ['Urgente', 'Administrativo'],
  },
  {
    folio: 'TICK-2026-0002',
    description:
      'Computadora docente con pantalla azul continua al abrir software de simulación.',
    affected_name: 'Ing. Carlos Mendoza Silva',
    contact_email: 'carlos.mendoza@itoaxaca.edu.mx',
    available_hours: '09:00 - 15:00',
    equipment_location: 'Laboratorio de Cómputo 1 - Cubículo 4',
    priority: 2,
    statusCode: TicketStatus.CANALIZADA,
    issueTypeName: 'Falla de Software',
    tagNames: ['Laboratorio'],
  },
  {
    folio: 'TICK-2026-0003',
    description:
      'Impresora multifuncional de coordinación arroja código de error 0X83C0000A y no detecta tóner nuevo.',
    affected_name: 'Mtra. Sofía Morales Ruiz',
    contact_email: 'sofia.morales@itoaxaca.edu.mx',
    available_hours: '10:00 - 16:00',
    equipment_location: 'Edificio B - Jefatura de Sistemas',
    priority: 2,
    statusCode: TicketStatus.ASIGNADA,
    issueTypeName: 'Soporte a Impresoras',
    tagNames: ['Impresora', 'Administrativo'],
  },
  {
    folio: 'TICK-2026-0004',
    description:
      'Pérdida de enlace de red y lentitud intermitente en todo el switch del ala norte.',
    affected_name: 'Ing. Alejandro Toledo Cruz',
    contact_email: 'alejandro.toledo@itoaxaca.edu.mx',
    available_hours: '08:00 - 18:00',
    equipment_location: 'Rack de Telecomunicaciones - Edificio C',
    priority: 3,
    statusCode: TicketStatus.ATENDIENDO,
    issueTypeName: 'Conectividad y Redes',
    tagNames: ['Urgente', 'Red'],
  },
  {
    folio: 'TICK-2026-0005',
    description:
      'Mantenimiento preventivo semestral programado para 15 equipos del laboratorio de desarrollo.',
    affected_name: 'Dr. Roberto Canseco López',
    contact_email: 'roberto.canseco@itoaxaca.edu.mx',
    available_hours: '12:00 - 18:00',
    equipment_location: 'Laboratorio de Desarrollo de Software',
    priority: 1,
    statusCode: TicketStatus.SOLUCIONADA,
    issueTypeName: 'Mantenimiento Preventivo',
    tagNames: ['Laboratorio', 'Mantenimiento'],
  },
  {
    folio: 'TICK-2026-0006',
    description:
      'Instalación de paquetes de diseño CAD e inicialización de periféricos en estación de trabajo.',
    affected_name: 'Arq. Gabriela Ríos Peña',
    contact_email: 'gabriela.rios@itoaxaca.edu.mx',
    available_hours: '09:00 - 14:00',
    equipment_location: 'Taller de Arquitectura - Estación 3',
    priority: 1,
    statusCode: TicketStatus.CERRADA,
    issueTypeName: 'Falla de Software',
    tagNames: ['Administrativo'],
  },
];

