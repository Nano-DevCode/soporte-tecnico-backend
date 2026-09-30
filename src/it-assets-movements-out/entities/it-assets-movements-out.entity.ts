import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItAssetsMovement } from 'src/it-assets-movements/entities/it-assets-movement.entity';
import { ItAssetsStatus } from 'src/it-assets-status/entities/it-assets-status.entity';
import { Staff } from 'src/staff/entities/staff.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ItAssetsMovementsOut {
  @ApiProperty({
    description: 'Identificador único del detalle de salida',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Relación base con el registro general del movimiento',
    type: () => ItAssetsMovement,
  })
  @OneToOne(() => ItAssetsMovement, (movement) => movement.movementOut, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  movement!: ItAssetsMovement;

  @ApiProperty({
    description: 'Estado físico u operativo en el que se entregó el activo',
    type: () => ItAssetsStatus,
  })
  @Index()
  @ManyToOne(() => ItAssetsStatus, (status) => status.movementOut)
  @JoinColumn()
  itAssetsStatus!: ItAssetsStatus;

  @ApiPropertyOptional({
    description: 'Observaciones puntuales al momento de la salida',
    example: 'Se entrega sin cargador original.',
  })
  @Column('text', {
    nullable: true,
  })
  observations!: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del motivo o contexto de la salida',
    example: 'Préstamo para conferencia en auditorio.',
  })
  @Column('text', {
    nullable: true,
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Folio, vale o documento físico/digital que ampara la salida',
    example: 'VALE-2026-089',
  })
  @Column('text', {
    nullable: true,
  })
  voucher?: string;

  @ApiPropertyOptional({
    description: 'Personal al que se le entregó o asignó el equipo',
    type: () => Staff,
  })
  @Index()
  @ManyToOne(() => Staff, (staff) => staff.itAssetsMovementsOut)
  @JoinColumn()
  staff?: Staff;

  @ApiPropertyOptional({
    description: 'Ticket de soporte técnico relacionado con esta salida',
    type: () => Ticket,
  })
  @Index()
  @ManyToOne(() => Ticket, (ticket) => ticket.itAssetsMovementsOut, {
    nullable: true,
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket?: Ticket;
}
