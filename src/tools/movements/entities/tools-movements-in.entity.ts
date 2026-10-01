import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolsMovement } from './tools-movement.entity';
import { ToolsStatus } from 'src/tools/status/entities/tools-status.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ToolsMovementsIn {
  @ApiProperty({
    description: 'Identificador único del detalle de entrada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Relación base con el registro general del movimiento',
    type: () => ToolsMovement,
  })
  @OneToOne(() => ToolsMovement, (movement) => movement.movementIn, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  movement!: ToolsMovement;

  @ApiPropertyOptional({
    description:
      'Observaciones puntuales al momento de la entrada de la herramienta',
    example:
      'Se recibe herramienta después de reparación de cable de corriente.',
  })
  @Column('text', {
    nullable: true,
  })
  observations?: string;

  @ApiProperty({
    description:
      'Estado físico u operativo en el que se recibió la herramienta',
    type: () => ToolsStatus,
  })
  @Index()
  @ManyToOne(() => ToolsStatus, (status) => status.movementIn)
  @JoinColumn()
  toolsStatus!: ToolsStatus;
}
