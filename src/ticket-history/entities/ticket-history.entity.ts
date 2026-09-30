import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Status } from './status.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class TicketHistory {
  @ApiProperty({
    description:
      'Identificador único del registro en el historial del ticket (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Duración en la que el ticket permaneció en este estado.',
    example: 3600,
    default: 0,
  })
  @Column('int', { default: 0 })
  duration: number;

  @ApiProperty({
    description:
      'Fecha y hora en la que se generó este registro del historial.',
    example: '2026-07-12T16:45:00.000Z',
  })
  @Index()
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T16:45:00.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Estado asociado a este registro del historial.',
    type: () => Status,
  })
  @Index()
  @ManyToOne(() => Status, (status) => status.ticket_histories, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  status: Status;

  @ApiProperty({
    description: 'Ticket al cual pertenece este registro del historial.',
    type: () => Ticket,
  })
  @Index()
  @ManyToOne(() => Ticket, (ticket) => ticket.ticket_histories, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  ticket: Ticket;
}
