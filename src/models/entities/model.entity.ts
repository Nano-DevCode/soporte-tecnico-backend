import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equipment } from '../../equipments/entities/equipment.entity';
import { Brand } from 'src/brands/entities/brand.entity';

@Entity()
export class Model {
  @ApiProperty({
    description: 'Identificador único del modelo (UUID)',
    example: '3b9e81b4-96c2-4d11-8231-1823746de941',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre comercial del modelo de hardware',
    example: 'ThinkPad E14 Gen 4',
  })
  @Column('text')
  name: string;

  @ApiProperty({
    description: 'Marca fabricante asociada a este modelo',
    type: () => Brand,
  })
  @ManyToOne(() => Brand, (brand) => brand.model, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_brand' })
  id_brand: Brand;

  @ApiPropertyOptional({
    description:
      'Colección de equipos físicos registrados en inventario bajo este modelo',
    type: () => [Equipment],
  })
  @OneToMany(() => Equipment, (equipo) => equipo.id_model)
  equipment: Equipment[];

  // Columnas de auditoría con select: false ocultas de los esquemas públicos de Swagger
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
