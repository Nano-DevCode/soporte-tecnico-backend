import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItAssetsMovementsIn } from 'src/it-assets-movements-in/entities/it-assets-movements-in.entity';
import { ItAssetsMovementsOut } from 'src/it-assets-movements-out/entities/it-assets-movements-out.entity';
import { ItAsset } from 'src/it-assets/entities/it-asset.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ItAssetsStatus {
  @ApiProperty({
    description: 'Identificador único del estado de inventario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description:
      'Nombre del estado físico u operativo (Ej. BUENO, REGULAR, DAÑADO)',
    example: 'BUENO',
  })
  @Column('text', {
    unique: true,
    nullable: false,
  })
  name!: string;

  @ApiProperty({
    description: 'Descripción detallada de lo que implica este estado',
    example:
      'El equipo se encuentra en óptimas condiciones y operando correctamente.',
  })
  @Column('text', {
    nullable: false,
  })
  description!: string;

  @ApiPropertyOptional({
    description:
      'Lista de activos TI que actualmente tienen asignado este estado',
    type: () => [ItAsset],
  })
  @OneToMany(() => ItAsset, (itAsset) => itAsset.itAssetStatus)
  @JoinColumn()
  itAssets!: ItAsset[];

  @ApiPropertyOptional({
    description:
      'Historial de movimientos de entrada registrados con este estado',
    type: () => [ItAssetsMovementsIn],
  })
  @OneToMany(
    () => ItAssetsMovementsIn,
    (movementIn) => movementIn.itAssetsStatus,
  )
  movementIn!: ItAssetsMovementsIn[];

  @ApiPropertyOptional({
    description:
      'Historial de movimientos de salida registrados con este estado',
    type: () => [ItAssetsMovementsOut],
  })
  @OneToMany(
    () => ItAssetsMovementsOut,
    (movementOut) => movementOut.itAssetsStatus,
  )
  movementOut!: ItAssetsMovementsOut[];
}
