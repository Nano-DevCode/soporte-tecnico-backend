import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('folio_counters')
export class FolioCounter {
  @ApiProperty({
    description: 'Identificador único del contador de folios.',
    example: 'REQ_idPeriod_idDepartment',
  })
  @PrimaryColumn('varchar', { length: 100 })
  id: string;

  @ApiProperty({
    description: 'Valor actual del contador.',
    example: 1,
    default: 1,
  })
  @Column('int', { default: 1 })
  current_value: number;
}
