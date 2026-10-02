import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Staff } from 'src/users/entities/staff.entity';
import { Equipment } from 'src/equipments/entities/equipment.entity';
import { ConsumableMovement } from 'src/consumables/movements/entities/consumable-movement.entity';

@Entity()
export class Department {
  @ApiProperty({
    description: 'Identificador único del departamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Nombre oficial del departamento',
    example: 'Sistemas y Computación',
  })
  @Index()
  @Column('text', {
    unique: true,
  })
  name!: string;

  @ApiProperty({
    description:
      'Nivel de prioridad asignado al departamento para la atención de solicitudes o asignaciones',
    example: 1,
  })
  @Column('numeric')
  priority!: number;

  @ApiProperty({
    description:
      'Estado lógico del departamento (true = activo, false = inactivo)',
    example: true,
    default: true,
  })
  @Column('boolean', {
    default: true,
  })
  status!: boolean;

  @ApiProperty({
    description: 'Acrónimo o siglas representativas del departamento',
    example: 'SYC',
  })
  @Index()
  @Column('text', {
    unique: true,
  })
  acronym!: string;

  @ApiPropertyOptional({
    description: 'Lista de miembros del personal adscritos a este departamento',
    type: () => [Staff],
  })
  @OneToMany(() => Staff, (staff) => staff.department)
  staffMembers!: Staff[];

  // No documentados en Swagger por tener select: false
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

  @ApiPropertyOptional({
    description: 'Inventario de equipos físicos asignados al departamento',
    type: () => [Equipment],
  })
  @OneToMany(() => Equipment, (equipment) => equipment.id_departament)
  equipment!: Equipment[];

  @ApiPropertyOptional({
    description:
      'Historial de movimientos de consumibles vinculados al departamento',
    type: () => [ConsumableMovement],
  })
  @OneToMany(
    () => ConsumableMovement,
    (consumableMovement) => consumableMovement.id_departament_consumable,
  )
  consumableMovements!: ConsumableMovement[];
}
