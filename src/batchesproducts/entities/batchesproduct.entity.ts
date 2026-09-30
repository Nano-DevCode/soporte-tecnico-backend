import { ConsumableMovement } from 'src/consumable-movements/entities/consumable-movement.entity';
import { Consumable } from 'src/consumables/entities/consumable.entity';
import { ManyToOne, OneToMany } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Batchesproduct {
  @ApiProperty({
    description: 'Identificador único del lote de producto (UUID)',
    example: 'b4b07384-e223-4956-a5e2-bb51263c4588',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Consumible al que pertenece este lote o entrada',
    type: () => Consumable,
  })
  @Index()
  @ManyToOne(() => Consumable, (consumable) => consumable.batchesproduct)
  @JoinColumn({ name: 'id_consumable' })
  id_consumable: Consumable;

  @ApiProperty({
    description:
      'Número de oficio de requerimiento, requisición o factura de compra',
    example: 'REQ-2026-0412',
  })
  @Column('text')
  num_requirement: string;

  @ApiProperty({
    description:
      'Cantidad bruta de cajas, paquetes o unidades que ingresaron en el almacén',
    example: 10,
  })
  @Column('int')
  arrival_amount: number;

  @ApiProperty({
    description:
      'Cantidad total acondicionada calculada para consumo individual (arrival_amount × number_uses)',
    example: 10,
  })
  @Column('int')
  quantity_consumable: number;

  @ApiProperty({
    description:
      'Existencia o stock real actual disponible del lote que se descuenta con los consumos',
    example: 10,
  })
  @Column('int')
  available_stock: number;

  @ApiProperty({
    description: 'Costo total de adquisición asignado al lote completo',
    example: 4500.0,
  })
  @Column('decimal', { precision: 16, scale: 4 })
  cost_batch: number;

  @ApiProperty({
    description:
      'Costo financiero unitario calculado por pieza/fracción para movimientos de salida (cost_batch / quantity_consumable)',
    example: 450.0,
  })
  @Column('decimal', { precision: 16, scale: 4 })
  cost_unit: number;

  @ApiProperty({
    description:
      'Fecha y hora exacta de alta con precisión timestamptz para auditoría cronológica FIFO de consumos',
    example: '2026-07-01T14:45:40.000Z',
  })
  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  // Columna de actualización oculta de la serialización select: false
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    select: false,
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description:
      'Historial de movimientos, salidas o consumos vinculados a este lote específico',
    type: () => [ConsumableMovement],
  })
  @OneToMany(
    () => ConsumableMovement,
    (consumablemovements) => consumablemovements.id_batches_product,
    {
      onDelete: 'RESTRICT',
    },
  )
  consumableMovements: ConsumableMovement[];
}
