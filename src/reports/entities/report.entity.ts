import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  diagnosis: string;

  @Column('text')
  work_performed: string;

  @Column('text', {
    nullable: true,
  })
  required_materials?: string;

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

  // @ManyToOne(() => Ticket, (ticket) => ticket.reports, {
  //   onDelete: 'RESTRICT',
  // })
  // ticket: Ticket;
}
