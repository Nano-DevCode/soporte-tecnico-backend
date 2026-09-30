import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToolsMovementsIn } from 'src/tools-movements-in/entities/tools-movements-in.entity';
import { ToolsMovementsOut } from 'src/tools-movements-out/entities/tools-movements-out.entity';
import { Tool } from 'src/tools/entities/tool.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
}

@Entity()
export class ToolsMovement {
  @ApiProperty({
    description: 'Identificador único del movimiento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Fecha exacta en la que se registró el movimiento',
  })
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  @Index()
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de la última modificación del registro' })
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Tipo de movimiento (Entrada o Salida)',
    enum: MovementType,
    example: MovementType.IN,
  })
  @Column({
    name: 'movement_type',
    type: 'enum',
    enum: MovementType,
  })
  type!: MovementType;

  @ApiProperty({
    description: 'Herramienta sobre la cual se realiza el movimiento',
    type: () => Tool,
  })
  @Index()
  @ManyToOne(() => Tool, (tool) => tool.movements)
  tool!: Tool;

  @ApiPropertyOptional({
    description: 'Detalles específicos si es un movimiento de entrada',
    type: () => ToolsMovementsIn,
  })
  @OneToOne(() => ToolsMovementsIn, (movementIn) => movementIn.movement, {
    cascade: true,
  })
  movementIn!: ToolsMovementsIn;

  @ApiPropertyOptional({
    description: 'Detalles específicos si es un movimiento de salida',
    type: () => ToolsMovementsOut,
  })
  @OneToOne(() => ToolsMovementsOut, (movementOut) => movementOut.movement, {
    cascade: true,
  })
  movementOut!: ToolsMovementsOut;
}
