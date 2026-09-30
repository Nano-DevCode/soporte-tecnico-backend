import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ItAssetsType {
  @ApiProperty({
    description: 'Identificador único del tipo de activo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description:
      'Nombre de la categoría o tipo de activo (Ej. MONITOR, LAPTOP, IMPRESORA)',
    example: 'MONITOR',
  })
  @Column('text', {
    unique: true,
  })
  name!: string;

  // No documentados en Swagger por tener select: false
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
    description: 'Lista de activos físicos que pertenecen a este tipo',
    type: () => [ItAsset],
  })
  @OneToMany(() => ItAsset, (itAsset) => itAsset.itAssetsType)
  itAssets!: ItAsset[];
}
