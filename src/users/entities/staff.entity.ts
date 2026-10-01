import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Attend } from 'src/attends/entities/attend.entity';
import { Coordination } from 'src/coordinations/entities/coordination.entity';
import { Department } from 'src/departments/entities/department.entity';
import { ItAssetsMovementsOut } from 'src/it-assets/movements/entities/it-assets-movements-out.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { User } from 'src/users/entities/user.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Staff {
  @ApiProperty({
    description: 'Identificador único del personal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiPropertyOptional({
    description: 'ID de Telegram para notificaciones',
    example: 'StaffTelegram123',
  })
  @Column('text', {
    nullable: true,
    unique: true,
  })
  idTelegram?: string;

  @ApiProperty({
    description: 'Nombre(s) del miembro del personal',
    example: 'Juan',
  })
  @Index()
  @Column('text')
  name!: string;

  @ApiProperty({
    description: 'Apellido paterno',
    example: 'Pérez',
  })
  @Index()
  @Column('text')
  paternalSurname!: string;

  @ApiProperty({
    description: 'Apellido materno',
    example: 'Gómez',
  })
  @Index()
  @Column('text')
  maternalSurname!: string;

  @ApiProperty({
    description: 'Número de control institucional',
    example: 'EMP0001',
  })
  @Column('text')
  @Index()
  num_control!: string;

  @ApiPropertyOptional({
    description: 'RFC del personal',
    example: 'PEGI800101XYZ',
  })
  @Column('text', {
    nullable: true,
    default: null,
    unique: true,
  })
  rfc!: string;

  @Column('text', {
    select: false,
    nullable: true,
  })
  @Index()
  searchField!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    select: false,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    select: false,
  })
  @Index()
  updatedAt!: Date;

  @ApiProperty({
    description: 'Departamento al que pertenece el personal',
    type: () => Department,
  })
  @Index()
  @ManyToOne(() => Department, (department) => department.staffMembers, {
    nullable: false,
  })
  @JoinColumn({ name: 'departmentId' })
  department!: Department;

  @ApiPropertyOptional({
    description: 'Cuenta de usuario asociada al personal',
    type: () => User,
  })
  @JoinColumn()
  @OneToOne(() => User, (user) => user.staff)
  user!: User;

  @ApiPropertyOptional({ type: () => [Ticket] })
  @OneToMany(() => Ticket, (ticket) => ticket.jefe_depto)
  ticketsJefeDepto!: Ticket[];

  @ApiPropertyOptional({ type: () => [Ticket] })
  @OneToMany(() => Ticket, (ticket) => ticket.coordinator)
  ticketsCoordinator!: Ticket[];

  @ApiPropertyOptional({ type: () => [Attend] })
  @OneToMany(() => Attend, (attend) => attend.technician)
  attends!: Attend[];

  @ApiPropertyOptional({
    description: 'Coordinación asignada (si aplica)',
    type: () => Coordination,
  })
  @Index()
  @ManyToOne(() => Coordination, (coordination) => coordination.staffMembers, {
    nullable: true,
  })
  @JoinColumn({ name: 'coordinationId' })
  coordination!: Coordination;

  @ApiPropertyOptional({ type: () => [ItAssetsMovementsOut] })
  @OneToMany(() => ItAssetsMovementsOut, (movementOut) => movementOut.staff)
  @JoinColumn()
  itAssetsMovementsOut!: ItAssetsMovementsOut[];

  @ApiPropertyOptional({ type: () => [ItAssetsMovementsOut] })
  @OneToMany(() => ItAssetsMovementsOut, (movementOut) => movementOut.staff)
  @JoinColumn()
  toolsMovementsOut!: ItAssetsMovementsOut[];

  @BeforeInsert()
  checkFieldsBeforeInsert() {
    if (this.rfc) {
      this.rfc = this.rfc.toUpperCase().trim();
    }
    this.generateSearchField();
  }

  @BeforeUpdate()
  checkFieldsBeforeUpdate() {
    if (this.rfc) {
      this.rfc = this.rfc.toUpperCase().trim();
    }
    this.generateSearchField();
  }

  private generateSearchField() {
    const rawString = `${this.name || ''} ${this.paternalSurname || ''} ${this.maternalSurname || ''} ${this.num_control || ''}`;
    this.searchField = rawString
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
