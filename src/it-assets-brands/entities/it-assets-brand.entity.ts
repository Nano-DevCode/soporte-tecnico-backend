import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItAssetsModel } from 'src/it-assets-models/entities/it-assets-model.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ItAssetsBrand {
  @ApiProperty({
    description: 'Identificador único de la marca',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Nombre comercial de la marca de equipos TI',
    example: 'DELL',
  })
  @Column('text', {
    unique: true,
    select: true,
  })
  name!: string;

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
    description: 'Lista de modelos asociados a esta marca',
    type: () => [ItAssetsModel],
  })
  @OneToMany(() => ItAssetsModel, (itAssetsModel) => itAssetsModel.brand)
  models!: ItAssetsModel[];
}
