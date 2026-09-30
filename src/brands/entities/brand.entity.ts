import {
  Column,
  Entity,
  OneToMany,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Model } from 'src/models/entities/model.entity';

@Entity()
export class Brand {
  @ApiProperty({
    description: 'Identificador único de la marca (UUID)',
    example: 'f8c3d81b-96c2-4d11-8231-1823746de552',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre único del fabricante o marca comercial',
    example: 'Hewlett-Packard',
  })
  @Column('text', { unique: true })
  name: string;

  @ApiPropertyOptional({
    description: 'Modelos de hardware asociados y distribuidos por esta marca',
    type: () => [Model],
  })
  @OneToMany(() => Model, (model) => model.id_brand, {
    onDelete: 'RESTRICT',
  })
  model: Model[];

  // Columnas de auditoría oculta de esquemas públicos mediante select: false
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
