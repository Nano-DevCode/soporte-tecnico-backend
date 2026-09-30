import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  GENERAL = 'GENERAL',

  TICKET_CREATED = 'TICKET_CREATED', // Alguien creó un ticket
  TICKET_ASSIGNED = 'TICKET_ASSIGNED', // Te asignaron un ticket (ASIGNAR)

  TICKET_ROUTED = 'TICKET_ROUTED', // Ticket canalizado a otro departamento (CANALIZAR)
  TICKET_REJECTED = 'TICKET_REJECTED', // Ticket rechazado (RECHAZAR)
  TICKET_IN_PROGRESS = 'TICKET_IN_PROGRESS', // Técnico empezó a atenderlo (ATENDER)

  TICKET_SOLVED = 'TICKET_SOLVED', // Técnico reporta que ya lo solucionó (SOLUCIONAR)
  TICKET_NOT_SOLVED = 'TICKET_NOT_SOLVED', // Técnico no pudo solucionarlo (NO_SOLUCIONAR)

  TICKET_FINISHED = 'TICKET_FINISHED', // Centro de cómputo emite orden de trabajo/respuesta final (FINALIZAR)
  TICKET_CLOSED = 'TICKET_CLOSED', // Ticket cerrado definitivamente (CERRAR)

  INTERVENTION_LOGGED = 'INTERVENTION_LOGGED', // Técnico registra bitácora o intervención parcial
  TICKET_UPDATED = 'TICKET_UPDATED',
}

@Entity('notifications')
export class Notification {
  @ApiProperty({ description: 'ID de la notificación' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'ID del usuario destinatario' })
  @Column('uuid')
  @Index()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ApiProperty({ description: 'Título de la notificación' })
  @Column('text')
  title!: string;

  @ApiProperty({ description: 'Cuerpo del mensaje de la notificación' })
  @Column('text')
  message!: string;

  @ApiProperty({
    enum: NotificationType,
    default: NotificationType.GENERAL,
    description: 'Tipo de notificación para iconos/acciones',
  })
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type!: NotificationType;

  @ApiProperty({ description: 'Indica si el usuario ya leyó la notificación' })
  @Column('boolean', { default: false })
  isRead!: boolean;

  @ApiPropertyOptional({
    description: 'ID del recurso asociado (ej. Ticket ID)',
  })
  @Column('uuid', { nullable: true })
  entityId?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  @Index()
  createdAt!: Date;
}
