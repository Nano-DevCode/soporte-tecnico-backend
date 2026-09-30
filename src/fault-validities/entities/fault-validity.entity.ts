import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TechnicalReport } from 'src/technical-reports/entities/technical-report.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class FaultValidity {
  @ApiProperty({
    description: 'Identificador único de la validez de la falla (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre descriptivo de la validez de la falla (único).',
    example: 'Falla Técnica Valida',
  })
  @Column('varchar', { unique: true })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada sobre la validez de la falla.',
    example: 'Indica que la falla reportada es verídica y verificada.',
  })
  @Column('text', { nullable: true })
  description?: string;

  @ApiProperty({
    description:
      'Indica si esta validez conlleva una penalización para el equipo.',
    default: false,
  })
  @Column('boolean', { default: false })
  penalizes_equipment: boolean;

  @ApiProperty({
    description: 'Lista de informes técnicos asociados a esta validez.',
    type: () => [TechnicalReport],
  })
  @OneToMany(() => TechnicalReport, (report) => report.fault_validity)
  technical_reports: TechnicalReport[];
}
