import { Batchesproduct } from '../batches/entities/batchesproduct.entity';
import { BrandConsumable } from '../brands/entities/brand-consumable.entity';
import { ConsumableUbication } from '../ubications/entities/consumable_ubication.entity';
import { Typeconsumable } from '../types/entities/typeconsumable.entity';
import { UnitMeasurement } from '../units/entities/unit-measurement.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TechnicalReport } from 'src/technical-reports/entities/technical-report.entity';

@Entity()
export class Consumable {
  @ApiProperty({
    description: 'Identificador único del consumible (UUID)',
    example: 'c2b07384-e223-4956-a5e2-bb51263c4577',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Código de barras, SKU o clave interna única del artículo',
    example: 'CONS-TON-0042',
  })
  @Column('text', { unique: true })
  item_code: string;

  @ApiProperty({
    description: 'Nombre comercial o identificador corto del consumible',
    example: 'Tóner HP 85A Negro',
  })
  @Column('text')
  name: string;

  @ApiProperty({
    description:
      'Descripción detallada de las especificaciones y compatibilidad del artículo',
    example:
      'Cartucho de tóner LaserJet original negro compatible con impresoras HP P1102w.',
  })
  @Column('text', { unique: true })
  description: string;

  @ApiProperty({
    description:
      'Cantidad estimada de ciclos o usos promedio que ofrece el consumible',
    example: 1600,
  })
  @Column('int', { default: 1 })
  number_uses: number;

  @ApiPropertyOptional({
    description:
      'Ruta URL absoluta de la fotografía o imagen del consumible almacenada en el servidor de archivos',
    example: 'https://api.sistema.com/uploads/consumables/toner-85a.png',
  })
  @Column('text', { nullable: true })
  imageUrl: string;

  @ApiPropertyOptional({
    description:
      'Cantidad mínima de stock recomendada para mantener disponible el consumible',
    example: 10,
  })
  @Column('numeric', { nullable: true })
  stockMin: number;

  @ApiPropertyOptional({
    description:
      'Cantidad máxima de stock recomendada para mantener disponible el consumible',
    example: 100,
  })
  @Column('numeric', { nullable: true })
  stockMax: number;

  @ApiPropertyOptional({
    description:
      'Existencia o stock real actual disponible del consumible calculado a partir de los lotes',
    example: 10,
    readOnly: true,
  })
  available_stock?: number;

  @ApiProperty({
    description: 'Ubicación de almacenamiento vinculada',
    type: () => ConsumableUbication,
  })
  @ManyToOne(
    () => ConsumableUbication,
    (consumableubication) => consumableubication.consumable,
  )
  @JoinColumn({ name: 'id_ubication_consumable' })
  id_ubication_consumable: ConsumableUbication;

  @ApiProperty({
    description: 'Fabricante o marca vinculada',
    type: () => BrandConsumable,
  })
  @ManyToOne(
    () => BrandConsumable,
    (brandconsumable) => brandconsumable.consumable,
  )
  @JoinColumn({ name: 'id_brand_consumable' })
  id_brand_consumable: BrandConsumable;

  @ApiProperty({
    description: 'Categoría o tipo de insumo vinculado',
    type: () => Typeconsumable,
  })
  @ManyToOne(
    () => Typeconsumable,
    (typeconsumable) => typeconsumable.consumable,
  )
  @JoinColumn({ name: 'id_type_consumable' })
  id_type_consumable: Typeconsumable;

  @ApiProperty({
    description: 'unidad de medida con la que se usa el consumible',
    type: () => UnitMeasurement,
  })
  @ManyToOne(
    () => UnitMeasurement,
    (unitmeasurement) => unitmeasurement.consumable,
  )
  @JoinColumn({ name: 'id_unit_measurement' })
  id_unit_measurement: UnitMeasurement;

  @ApiPropertyOptional({
    description:
      'Historial de lotes, existencias y entradas de almacén asociadas a este artículo',
    type: () => [Batchesproduct],
  })
  @OneToMany(
    () => Batchesproduct,
    (batchesproducts) => batchesproducts.id_consumable,
    {
      onDelete: 'RESTRICT',
    },
  )
  batchesproduct: Batchesproduct[];

  @ApiPropertyOptional({
    description:
      'Reportes técnicos en los que se ha utilizado este consumible.',
    type: () => [TechnicalReport],
  })
  @ManyToMany(
    () => TechnicalReport,
    (technical_report) => technical_report.consumables,
  )
  technical_reports: TechnicalReport[];

  // Auditoría
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
