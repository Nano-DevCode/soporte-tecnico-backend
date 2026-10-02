import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PauseReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column('text', {
  //   unique: true,
  // })
  // folio: string;

  @Column('text')
  diagnosis: string;

  @Column('text')
  justification: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToOne(() => Ticket, (ticket) => ticket.pause_report, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn()
  ticket: Ticket;
}
