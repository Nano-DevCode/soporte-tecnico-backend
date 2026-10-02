import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Computer } from '../../entities/computer.entity';

@Entity()
export class Operatingsystem {
  @ApiProperty({
    description: 'Identificador único del sistema operativo (UUID)',
    example: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre oficial y edición del sistema operativo',
    example: 'Windows 11 Pro 64-bit',
  })
  @Column()
  name: string;

  @ApiPropertyOptional({
    description:
      'Lista de computadoras que tienen instalado este sistema operativo',
    type: () => [Computer],
  })
  @OneToMany(() => Computer, (computo) => computo.id_type_operating_system, {
    onDelete: 'RESTRICT',
  })
  operating_system: Computer[];

  // Columnas de auditoría interna con select: false ocultas en la documentación del esquema público
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
}
