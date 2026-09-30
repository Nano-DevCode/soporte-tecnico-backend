import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ItAssetsInvoice {
  @ApiProperty({
    description: 'Identificador único de la factura',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiPropertyOptional({
    description: 'Identificador, folio o número interno de la factura',
    example: 'FAC-2026-001',
  })
  @Column('text', {
    unique: true,
    nullable: true,
  })
  idInternal!: string;

  // No documentados en Swagger porque tienen select: false
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    select: false,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    select: false,
  })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'Lista de activos TI asociados a esta factura',
    type: () => [ItAsset],
  })
  @OneToMany(() => ItAsset, (itAsset) => itAsset.invoice)
  @JoinColumn()
  itAssets!: string;
}
