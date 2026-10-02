import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class RejectionReport {
  @ApiProperty({
    description: 'Identificador único del reporte de rechazo (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Justificación detallada por la cual se rechazó el ticket.',
    example: 'El la descripción del problema reportado es poca.',
  })
  @Column('text')
  justification: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro.',
    example: '2026-07-12T15:40:15.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T15:40:15.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // @ApiProperty({
  //   description: 'Ticket relacionado con este reporte de rechazo.',
  //   type: () => Ticket,
  // })
  @ApiHideProperty()
  @Index()
  @ManyToOne(() => Ticket, (ticket) => ticket.rejection_reports, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  ticket: Ticket;
}
