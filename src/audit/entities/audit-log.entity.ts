import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Entity('audit_log')
@Index(['entityName', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  entityName: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  entityId: string;

  @Index()
  @Column({
    type: 'enum',
    enum: AuditAction,
    default: AuditAction.CREATE,
  })
  action: AuditAction;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  performedBy: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  performedByEmail: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  requestId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  previousValues: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  changedFields: string[] | null;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
