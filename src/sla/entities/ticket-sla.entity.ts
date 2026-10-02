import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SlaStatus {
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  BREACHED = 'BREACHED',
  COMPLIANT = 'COMPLIANT',
}

@Entity('ticket_sla')
export class TicketSla {
  @ApiProperty({
    description: 'Identificador único del registro de SLA (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'ID del ticket asociado al registro de SLA.',
  })
  @Column('uuid')
  @Index({ unique: true })
  ticketId!: string;

  @ApiProperty({
    description: 'Ticket asociado al registro de SLA.',
    type: () => Ticket,
  })
  @OneToOne(() => Ticket, (ticket) => ticket.sla, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket!: Ticket;

  @ApiProperty({
    description: 'Nivel de prioridad del ticket en el cálculo.',
    example: 1,
  })
  @Column('int', { default: 4 })
  priority!: number;

  @ApiProperty({
    description: 'Tiempo máximo de resolución en horas según política de SLA.',
    example: 24,
  })
  @Column('decimal', { precision: 8, scale: 2, default: 24 })
  maxResolutionHours!: number;

  @ApiProperty({
    description:
      'Tiempo máximo de primera respuesta en horas según política de SLA.',
    example: 2,
  })
  @Column('decimal', { precision: 8, scale: 2, default: 4 })
  maxResponseHours!: number;

  @ApiProperty({
    description: 'Estado actual del SLA de resolución del ticket.',
    enum: SlaStatus,
    default: SlaStatus.ON_TRACK,
  })
  @Index()
  @Column({
    type: 'enum',
    enum: SlaStatus,
    default: SlaStatus.ON_TRACK,
  })
  slaStatus!: SlaStatus;

  @ApiProperty({
    description: 'Porcentaje consumido del tiempo límite de SLA (0% a 100%+).',
    example: 65.5,
  })
  @Column('decimal', { precision: 6, scale: 2, default: 0 })
  percentageConsumed!: number;

  @ApiPropertyOptional({
    description:
      'Fecha y hora en que se envió la alerta de riesgo preventiva (75%+ consumido).',
  })
  @Column({ type: 'timestamptz', nullable: true })
  warningAlertSentAt?: Date | null;

  @ApiPropertyOptional({
    description:
      'Fecha y hora en que se envió la alerta de violación (100%+ consumido).',
  })
  @Column({ type: 'timestamptz', nullable: true })
  breachedAlertSentAt?: Date | null;

  @ApiPropertyOptional({
    description:
      'Fecha y hora en que se registró la primera atención/respuesta técnica.',
  })
  @Column({ type: 'timestamptz', nullable: true })
  firstRespondedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Fecha y hora en que se resolvió o cerró el ticket.',
  })
  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date | null;

  @ApiProperty({
    description: 'Fecha de creación del seguimiento de SLA.',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del seguimiento de SLA.',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
