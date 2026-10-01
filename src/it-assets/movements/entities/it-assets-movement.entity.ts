import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItAssetsMovementsIn } from './it-assets-movements-in.entity';
import { ItAssetsMovementsOut } from './it-assets-movements-out.entity';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';
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
export class ItAssetsMovement {
  @ApiProperty({
    description: 'Identificador único del movimiento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Fecha exacta en la que se registró el movimiento',
  })
  @Index()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de última modificación del registro' })
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
    description: 'Activo TI sobre el cual se realiza el movimiento',
    type: () => ItAsset,
  })
  @Index()
  @ManyToOne(() => ItAsset, (itAsset) => itAsset.movements)
  itAsset!: ItAsset;

  @ApiPropertyOptional({
    description: 'Detalles específicos si es un movimiento de entrada',
    type: () => ItAssetsMovementsIn,
  })
  @OneToOne(() => ItAssetsMovementsIn, (movementIn) => movementIn.movement, {
    cascade: true,
  })
  movementIn!: ItAssetsMovementsIn;

  @ApiPropertyOptional({
    description: 'Detalles específicos si es un movimiento de salida',
    type: () => ItAssetsMovementsOut,
  })
  @OneToOne(() => ItAssetsMovementsOut, (movementOut) => movementOut.movement, {
    cascade: true,
  })
  movementOut!: ItAssetsMovementsOut;
}
