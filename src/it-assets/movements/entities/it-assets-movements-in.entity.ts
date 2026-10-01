import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItAssetsMovement } from './it-assets-movement.entity';
import { ItAssetsStatus } from 'src/it-assets/status/entities/it-assets-status.entity';
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
export class ItAssetsMovementsIn {
  @ApiProperty({
    description: 'Identificador único del detalle de entrada del activo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description:
      'Registro general del movimiento (cabecera) asociado a esta entrada',
    type: () => ItAssetsMovement,
  })
  @OneToOne(() => ItAssetsMovement, (movement) => movement.movementIn, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  movement!: ItAssetsMovement;

  @ApiPropertyOptional({
    description: 'Observaciones puntuales o estado en el que ingresa el activo',
    example:
      'Ingresa al almacén tras revisión de mantenimiento. Se reemplazó el disco duro.',
  })
  @Column('text', {
    nullable: true,
  })
  observations?: string;

  @ApiProperty({
    description: 'Estado físico u operativo en el que se recibe el activo TI',
    type: () => ItAssetsStatus,
  })
  @Index()
  @ManyToOne(() => ItAssetsStatus, (status) => status.movementIn)
  @JoinColumn()
  itAssetsStatus!: ItAssetsStatus;
}
