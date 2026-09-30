import {
  Column,
  CreateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Entity,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Computer } from 'src/computers/entities/computer.entity';

@Entity()
export class Computerequipmenttype {
  @ApiProperty({
    description: 'Identificador único del tipo de equipo de cómputo (UUID)',
    example: '5a2e81b4-96c2-4d11-8231-1823746de509',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre o categoría del tipo de equipo de cómputo',
    example: 'Laptop',
  })
  @Column('text')
  name: string;

  @ApiPropertyOptional({
    description:
      'Lista de computadoras (especificaciones de hardware) asociadas a este tipo',
    type: () => [Computer],
  })
  @OneToMany(
    () => Computer,
    (computer) => computer.id_type_equipment_computer,
    {
      onDelete: 'RESTRICT',
    },
  )
  type_equipment_computer: Computer[];
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
