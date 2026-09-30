import { ApiProperty } from '@nestjs/swagger';
import { Response } from 'src/responses/entities/response.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index('IDX_ONLY_ONE_ACTIVE_MANAGER', ['is_active'], {
  unique: true,
  where: '"is_active" = true',
})
export class ComputingCenterManager {
  @ApiProperty({
    description:
      'Identificador único del jefe del Departamento de Centro de Cómputo (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombres del gerente.',
    example: 'Claribel',
  })
  @Column('text')
  names: string;

  @ApiProperty({
    description: 'Primer apellido del gerente.',
    example: 'Benítez',
  })
  @Column('text')
  first_last_name: string;

  @ApiProperty({
    description: 'Segundo apellido del gerente.',
    example: 'Quecha',
  })
  @Column('text')
  second_last_name: string;

  @ApiProperty({
    description: 'Indica si el gerente está activo actualmente.',
    default: false,
  })
  @Column('boolean', {
    default: false,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'RFC del gerente (único).',
    example: 'PELJ800101XYZ',
  })
  @Column('varchar', { length: 13, unique: true })
  rfc: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro.',
    example: '2026-07-12T15:17:53.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T15:17:53.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Lista de respuestas asociadas a este gerente.',
    type: () => [Response],
  })
  @OneToMany(() => Response, (response) => response.computing_center_manager, {
    onDelete: 'RESTRICT',
  })
  responses: Response[];
}
