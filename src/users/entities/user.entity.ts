import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/roles/entities/role.entity';
import { Staff } from 'src/staff/entities/staff.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @ApiProperty({
    description: 'Identificador único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@institucion.edu.mx',
  })
  @Column('text', {
    unique: true,
  })
  email!: string;

  @Column('text', {
    select: false,
  })
  password!: string;

  @ApiPropertyOptional({
    description: 'URL o ruta de la imagen de perfil del usuario',
    example: 'https://ejemplo.com/avatar.png',
  })
  @Column('text', {
    nullable: true,
  })
  avatar!: string;

  @ApiProperty({
    description: 'Estado de la cuenta (activa/inactiva)',
    example: true,
    default: true,
  })
  @Column('bool', {
    default: true,
  })
  status!: boolean;

  @ApiProperty({
    description: 'Preferencias granulares de notificaciones del sistema',
    example: { TICKET_CREATED: true, TICKET_UPDATED: false },
  })
  @Column('jsonb', {
    nullable: true,
    default: {},
  })
  notificationPreferences!: Record<string, boolean>;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    select: false,
  })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    select: false,
  })
  @Index()
  updatedAt!: Date;

  @ApiProperty({
    description: 'Rol de sistema asignado al usuario',
    type: () => Role,
  })
  @Index()
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'roleId' })
  role!: Role;

  @ApiPropertyOptional({
    description: 'Información del personal vinculada a esta cuenta (si aplica)',
    type: () => Staff,
  })
  @OneToOne(() => Staff, (staff) => staff.user)
  staff!: Staff;

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    this.checkFieldsBeforeInsert();
  }
}
