import { ApiProperty } from '@nestjs/swagger';
import { Staff } from 'src/staff/entities/staff.entity';
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
@Index('IDX_UNIQUE_ACTIVE_ATTEND', ['ticket', 'technician'], {
  unique: true,
  where: '"is_active" = true',
})
export class Attend {
  @ApiProperty({
    description: 'Identificador único del registro de atención (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Indica si el técnico y el ticket estan asignados actualmente o es solo un registro pasado de asignación.',
    default: true,
  })
  @Column('boolean', {
    default: true,
  })
  is_active: boolean;

  @ApiProperty({
    description:
      'Indica si el técnico se encuentra atendiendo el ticket actualmente.',
    default: false,
  })
  @Column('boolean', {
    default: false,
  })
  is_attending: boolean;

  @ApiProperty({
    description: 'Fecha y hora en la que se asignó la atención.',
    example: '2026-07-12T15:11:52.000Z',
  })
  @Index()
  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  assigned_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T15:11:52.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Ticket asociado a esta atención.',
    type: () => Ticket,
  })
  @Index()
  @ManyToOne(() => Ticket, (ticket) => ticket.attends)
  ticket: Ticket;

  @ApiProperty({
    description: 'Técnico encargado de la atención.',
    type: () => Staff,
  })
  @Index()
  @ManyToOne(() => Staff, (technician) => technician.attends)
  technician: Staff;
}
