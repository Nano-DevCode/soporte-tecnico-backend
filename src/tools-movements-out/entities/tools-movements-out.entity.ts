import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Staff } from 'src/users/entities/staff.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { ToolsMovement } from 'src/tools-movements/entities/tools-movement.entity';
import { ToolsStatus } from 'src/tools-status/entities/tools-status.entity';
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
export class ToolsMovementsOut {
  @ApiProperty({
    description: 'Identificador único del detalle de salida',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Relación base con el registro general del movimiento',
    type: () => ToolsMovement,
  })
  @OneToOne(() => ToolsMovement, (movement) => movement.movementOut, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  movement!: ToolsMovement;

  @ApiProperty({
    description:
      'Estado físico u operativo en el que se entregó la herramienta',
    type: () => ToolsStatus,
  })
  @Index()
  @ManyToOne(() => ToolsStatus, (status) => status.movementOut)
  @JoinColumn()
  toolStatus!: ToolsStatus;

  @ApiPropertyOptional({
    description: 'Observaciones puntuales al momento de la salida',
    example: 'Se entrega taladro sin brocas adicionales.',
  })
  @Column('text', {
    nullable: true,
  })
  observations!: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del motivo de la salida',
    example: 'Asignación para trabajos de mantenimiento en el edificio B.',
  })
  @Column('text', {
    nullable: true,
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Folio, vale o documento físico/digital que ampara la salida',
    example: 'VALE-HER-2026-045',
  })
  @Column('text', {
    nullable: true,
  })
  voucher?: string;

  @ApiPropertyOptional({
    description: 'Personal al que se le entregó la herramienta',
    type: () => Staff,
  })
  @Index()
  @ManyToOne(() => Staff, (staff) => staff.toolsMovementsOut)
  @JoinColumn()
  staff?: Staff;

  @ApiPropertyOptional({
    description:
      'Ticket de soporte o mantenimiento relacionado con esta salida',
    type: () => Ticket,
  })
  @Index()
  @ManyToOne(() => Ticket, (ticket) => ticket.toolsMovementsOut, {
    nullable: true,
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket?: Ticket;
}
