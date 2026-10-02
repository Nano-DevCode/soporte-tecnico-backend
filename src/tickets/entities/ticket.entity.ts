import { Document } from 'src/documents/entities/document.entity';
import { IssueType } from 'src/issue_type/entities/issue_type.entity';
import { RejectionReport } from 'src/rejection-reports/entities/rejection-report.entity';
import { SchoolPeriod } from 'src/school-periods/entities/school-period.entity';
import { Tag } from 'src/tags/entities/tag.entity';
import { TicketHistory } from 'src/ticket-history/entities/ticket-history.entity';
import { TicketSla } from 'src/sla/entities/ticket-sla.entity';
import { TicketSurvey } from 'src/survey/entities/ticket-survey.entity';
import { Response } from 'src/responses/entities/response.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { PauseReport } from 'src/pause-reports/entities/pause-report.entity';
import { Attend } from 'src/attends/entities/attend.entity';
import { Staff } from 'src/users/entities/staff.entity';
import { TechnicalReport } from 'src/technical-reports/entities/technical-report.entity';
import { ItAssetsMovementsOut } from 'src/it-assets/movements/entities/it-assets-movements-out.entity';
import { ConsumableMovement } from 'src/consumables/movements/entities/consumable-movement.entity';
import { ToolsMovementsOut } from 'src/tools/movements/entities/tools-movements-out.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Ticket {
  @ApiProperty({
    description: 'Identificador único del ticket (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Folio público único del ticket.',
    example: 'DIR-20261-0001',
  })
  @Column('text', {
    unique: true,
  })
  folio: string;

  @ApiProperty({
    description: 'Descripción detallada del problema reportado.',
    example: 'El monitor no enciende tras conectar el cable de corriente.',
  })
  @Column('text')
  description: string;

  @ApiProperty({
    description:
      'Nombre del responsable directo del equipo que presenta la falla.',
    example: 'Juan Pérez',
  })
  @Column('text')
  affected_name: string;

  @ApiPropertyOptional({
    description: 'URL de la evidencia (imagen o documento) del problema.',
    example: 'https://storage.example.com/evidence/img1.jpg',
  })
  @Column('text', {
    nullable: true,
  })
  evidence_url?: string;

  @ApiProperty({
    description:
      'Correo electrónico de contacto del responsable directo del equipo.',
    example: 'usuario@empresa.com',
  })
  @Column('text')
  contact_email: string;

  @ApiProperty({
    description: 'Horario disponible para atención técnica.',
    example: '09:00 - 15:00',
  })
  @Column('text')
  available_hours: string;

  @ApiProperty({
    description: 'Ubicación física del equipo.',
    example: 'Edificio A, Laboratorio 2',
  })
  @Column('text')
  equipment_location: string;

  @ApiProperty({
    description: 'Nivel de prioridad del ticket.',
    example: 1,
    default: 0,
  })
  @Column('int', {
    default: 0,
  })
  priority: number;

  @ApiProperty({
    description: 'Versión del registro para control de concurrencia optimista.',
  })
  @VersionColumn()
  version: number;

  @ApiPropertyOptional({
    description:
      'Folio interno del Centro de Cómputo único de la solicitud y Orden de Trabajo.',
    example: 'OT-2026-0001-DEP',
  })
  @Column('text', { nullable: true, unique: true })
  ot_folio: string;

  @ApiPropertyOptional({
    description:
      'Folio interno del Centro de Cómputo único del ticket (utilizado para las respuestas).',
    example: 'INT-2026-0001',
  })
  @Column('text', { nullable: true, unique: true })
  internal_folio: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del ticket.',
    example: '2026-07-12T16:50:00.000Z',
  })
  @Index()
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del ticket.',
    example: '2026-07-12T16:50:00.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Periodo escolar al que pertenece el ticket.',
    type: () => SchoolPeriod,
  })
  @Index()
  @ManyToOne(() => SchoolPeriod, (school_period) => school_period.tickets, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  school_period: SchoolPeriod;

  @ApiProperty({
    description: 'Tipo de problema del ticket.',
    type: () => IssueType,
  })
  @Index()
  @ManyToOne(() => IssueType, (issue_type) => issue_type.tickets, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  issue_type: IssueType;

  @ApiProperty({
    description: 'Etiquetas asignadas al ticket.',
    type: () => [Tag],
  })
  @ManyToMany(() => Tag, (tag) => tag.tickets)
  @JoinTable()
  tags: Tag[];

  @ApiProperty({
    description: 'Historial de cambios y estados del ticket.',
    type: () => [TicketHistory],
  })
  @OneToMany(() => TicketHistory, (ticket_history) => ticket_history.ticket, {
    onDelete: 'RESTRICT',
  })
  ticket_histories: TicketHistory[];

  @ApiProperty({
    description: 'Documentos adjuntos al ticket.',
    type: () => [Document],
  })
  @OneToMany(() => Document, (document) => document.ticket, {
    onDelete: 'RESTRICT',
  })
  documents: Document[];

  @ApiProperty({
    description: 'Respuesta final al ticket.',
    type: () => Response,
  })
  @OneToOne(() => Response, (response) => response.ticket, {
    onDelete: 'RESTRICT',
  })
  response: Response;

  @ApiProperty({
    description: 'Bitácoras técnicas realizadas para este ticket.',
    type: () => [TechnicalReport],
  })
  @OneToMany(
    () => TechnicalReport,
    (technicalReport) => technicalReport.ticket,
    {
      onDelete: 'RESTRICT',
    },
  )
  technical_reports: TechnicalReport[];

  @ApiProperty({
    description: 'Reportes de rechazo asociados al ticket.',
    type: () => [RejectionReport],
  })
  @OneToMany(
    () => RejectionReport,
    (rejection_report) => rejection_report.ticket,
    {
      onDelete: 'RESTRICT',
    },
  )
  rejection_reports: RejectionReport[];

  @ApiProperty({
    description: 'Reporte de pausa del ticket.',
    type: () => PauseReport,
  })
  @OneToOne(() => PauseReport, (pause_report) => pause_report.ticket, {
    onDelete: 'RESTRICT',
  })
  pause_report: PauseReport;

  @ApiProperty({
    description: 'Jefe de departamento quien creó el ticket.',
    type: () => Staff,
  })
  @Index()
  @ManyToOne(() => Staff, (jefeDepto) => jefeDepto.ticketsJefeDepto, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  jefe_depto: Staff;

  @ApiProperty({
    description: 'Registros de atención del ticket.',
    type: () => [Attend],
  })
  @OneToMany(() => Attend, (attend) => attend.ticket, {
    onDelete: 'RESTRICT',
  })
  attends: Attend[];

  @ApiProperty({
    description: 'Coordinador asignado al ticket.',
    type: () => Staff,
  })
  @Index()
  @ManyToOne(() => Staff, (coordinador) => coordinador.ticketsCoordinator, {
    onDelete: 'RESTRICT',
  })
  coordinator: Staff;

  @ApiProperty({
    description: 'Movimientos de salida de activos TI.',
    type: () => [ItAssetsMovementsOut],
  })
  @OneToMany(() => ItAssetsMovementsOut, (movementOut) => movementOut.ticket)
  itAssetsMovementsOut!: ItAssetsMovementsOut[];

  @ApiProperty({
    description: 'Movimientos de salida de herramientas.',
    type: () => [ToolsMovementsOut],
  })
  @OneToMany(() => ToolsMovementsOut, (movementOut) => movementOut.ticket)
  toolsMovementsOut!: ToolsMovementsOut[];

  @ApiProperty({
    description: 'Movimiento de consumibles asociado.',
    type: () => [ConsumableMovement],
  })
  @OneToMany(
    () => ConsumableMovement,
    (consumable_movement) => consumable_movement.id_ticket,
    {
      onDelete: 'RESTRICT',
    },
  )
  consumable_movement: ConsumableMovement[];

  @ApiPropertyOptional({
    description: 'Registro de métricas y monitoreo SLA asociado al ticket.',
    type: () => TicketSla,
  })
  @OneToOne(() => TicketSla, (sla) => sla.ticket, {
    nullable: true,
  })
  sla?: TicketSla;

  @ApiPropertyOptional({
    description: 'Encuesta de satisfacción de servicio asociada al ticket.',
    type: () => TicketSurvey,
  })
  @OneToOne(() => TicketSurvey, (survey) => survey.ticket, {
    nullable: true,
  })
  survey?: TicketSurvey;
}
