import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Staff } from 'src/staff/entities/staff.entity';
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
export class Coordination {
  @ApiProperty({
    description: 'Identificador único de la coordinación',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre de la coordinación',
    example: 'Coordinación de Sistemas',
  })
  @Index()
  @Column('text', {
    unique: true,
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Lista de miembros del personal asignados a esta coordinación',
    type: () => [Staff],
  })
  @OneToMany(() => Staff, (staff) => staff.coordination)
  staffMembers: Staff[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    select: false,
  })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    select: false,
  })
  updatedAt: Date;
}
