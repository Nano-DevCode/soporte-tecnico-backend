import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Computer } from '../../entities/computer.entity';

@Entity()
export class Computerprocessor {
  @ApiProperty({
    description: 'Identificador único del procesador (UUID)',
    example: 'd9b07384-e223-4956-a5e2-bb51263c4581',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Marca o fabricante del procesador',
    example: 'Intel',
  })
  @Column('text')
  brand: string;

  @ApiProperty({
    description: 'Modelo específico del procesador',
    example: 'Core i7-13700K',
  })
  @Column()
  model: string;

  @ApiProperty({
    description:
      'Detalles técnicos adicionales del procesador (Núcleos, velocidad base, hilos)',
    example: '16 Cores (8P + 8E) up to 5.4 GHz, 30MB Cache',
  })
  @Column()
  description: string;

  @ApiPropertyOptional({
    description: 'Lista de computadoras que tienen equipado este procesador',
    type: () => [Computer],
  })
  @OneToMany(
    () => Computer,
    (procesadorcomputadora) => procesadorcomputadora.id_processor,
    {
      onDelete: 'RESTRICT',
    },
  )
  id_processor: Computer[];

  // Columnas de auditoría oculta en Swagger por select: false
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
