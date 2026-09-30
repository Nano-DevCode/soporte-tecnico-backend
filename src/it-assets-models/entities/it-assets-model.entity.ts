import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItAssetsBrand } from 'src/it-assets-brands/entities/it-assets-brand.entity';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';
import { Entity, Index, OneToMany } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ItAssetsModel {
  @ApiProperty({
    description: 'Identificador único del modelo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Nombre del modelo del equipo',
    example: 'LATITUDE 5420',
  })
  @Column('text')
  name!: string;

  // No se documentan en Swagger al tener select: false
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

  @ApiProperty({
    description: 'Marca a la que pertenece este modelo',
    type: () => ItAssetsBrand,
  })
  @Index()
  @ManyToOne(() => ItAssetsBrand, (itAssetsBrand) => itAssetsBrand.models, {
    eager: true,
    nullable: false,
  })
  @JoinColumn()
  brand!: ItAssetsBrand;

  @ApiPropertyOptional({
    description: 'Lista de activos TI físicos que son de este modelo',
    type: () => [ItAsset],
  })
  @OneToMany(() => ItAsset, (itAsset) => itAsset.model)
  itAssets!: ItAsset[];
}
