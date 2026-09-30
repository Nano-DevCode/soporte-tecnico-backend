import { ApiProperty } from '@nestjs/swagger';
import { Response } from 'src/responses/entities/response.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum SignatureRole {
  JEFE_CC = 'JEFE_CC',
  JEFE_DEPTO = 'JEFE_DEPTO',
  PLANEACION = 'PLANEACION',
}

@Entity()
@Index('IDX_UNIQUE_SIGNATURE_PER_RESPONSE', ['response', 'role'], {
  unique: true,
})
export class ResponseSignature {
  @ApiProperty({
    description: 'Identificador único de la firma (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Rol del firmante en la respuesta.',
    enum: SignatureRole,
    example: SignatureRole.JEFE_CC,
  })
  @Column('enum', { enum: SignatureRole })
  role: SignatureRole;

  @ApiProperty({
    description: 'Hash generado de la firma digital.',
    example: 'a1b2c3d4e5f6g7h8i9j0...',
  })
  @Column('text')
  signature_hash: string;

  @ApiProperty({
    description: 'Cadena original utilizada para la generación de la firma.',
    example: 'data_string_to_sign',
  })
  @Column('text')
  original_chain: string;

  @ApiProperty({
    description: 'Fecha y hora en la que se realizó la firma.',
    example: '2026-07-12T15:51:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamptz' })
  signed_at: Date;

  @ApiProperty({
    description: 'Respuesta a la cual pertenece esta firma.',
    type: () => Response,
  })
  @Index()
  @ManyToOne(() => Response, (response) => response.signatures, {
    onDelete: 'RESTRICT',
  })
  response: Response;
}
