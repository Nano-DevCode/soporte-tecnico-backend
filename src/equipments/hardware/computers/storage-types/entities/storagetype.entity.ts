import {
  Column,
  CreateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Entity,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Computer } from '../../entities/computer.entity';

@Entity()
export class Storagetype {
  @ApiProperty({
    description: 'Identificador único del tipo de almacenamiento (UUID)',
    example: '7c3d81b4-96c2-4d11-8231-1823746de612',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre o tecnología de la unidad de almacenamiento',
    example: 'SSD NVMe M.2',
  })
  @Column('text')
  name: string;

  @ApiPropertyOptional({
    description:
      'Lista de computadoras asociadas a este tipo de unidad de almacenamiento',
    type: () => [Computer],
  })
  @OneToMany(() => Computer, (computer) => computer.id_type_storage, {
    onDelete: 'RESTRICT',
  })
  type_storage: Computer[];

  // Columnas de auditoría con select: false ocultas de los esquemas públicos
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
