import {
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  Entity,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equipment } from 'src/equipments/entities/equipment.entity';

@Entity()
export class Responsibleequipment {
  @ApiProperty({
    description: 'Identificador único del responsable (UUID)',
    example: 'e3b07384-e223-4956-a5e2-bb51263c4599',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Número de empleado o clave institucional única',
    example: 'EMP-2026-0815',
  })
  @Column('text', { unique: true })
  num_employe: string;

  @ApiProperty({
    description: 'Nombre o nombres del personal responsable',
    example: 'Juan Carlos',
  })
  @Column('text')
  name: string;

  @ApiProperty({
    description: 'Primer apellido (apellido paterno)',
    example: 'Pérez',
  })
  @Column('text')
  first_name: string;

  @ApiProperty({
    description: 'Segundo apellido (apellido materno)',
    example: 'Gómez',
  })
  @Column('text')
  last_name: string;

  @ApiProperty({
    description: 'Área académica o administrativa a la que pertenece',
    example: 'Centro de Cómputo',
  })
  @Column('text')
  area: string;

  @ApiProperty({
    description: 'Correo electrónico institucional único del responsable',
    example: 'juan.perez@empresa.com',
  })
  @Column('text', { unique: true })
  mail: string;

  // Columnas de auditoría interna ocultas del esquema público con select: false
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    select: false,
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    select: false,
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description:
      'Colección de bienes o activos de hardware bajo el resguardo de este responsable',
    type: () => [Equipment],
  })
  @OneToMany(() => Equipment, (equipment) => equipment.id_responsable)
  equipo: Equipment[];
}
