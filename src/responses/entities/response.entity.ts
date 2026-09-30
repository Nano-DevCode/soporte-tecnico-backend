import { ApiProperty } from '@nestjs/swagger';
import { ComputingCenterManager } from 'src/computing-center-manager/entities/computing-center-manager.entity';
import { MaintenanceType } from 'src/maintenance-type/entities/maintenance-type.entity';
import { ResponseSignature } from 'src/response-signature/entities/response-signature.entity';
import { ServiceType } from 'src/service-type/entities/service-type.entity';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Response {
  @ApiProperty({
    description: 'Identificador único de la respuesta (UUID).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Diagnóstico del problema.',
    example: 'Se detectó falla en el disco duro por desgaste físico.',
  })
  @Column('text')
  diagnosis: string;

  @ApiProperty({
    description:
      'Descripción del trabajo realizado para solucionar el problema.',
    example: 'Se reemplazó el disco duro y se reinstaló el sistema operativo.',
  })
  @Column('text')
  work_done: string;

  @ApiProperty({
    description: 'Fecha y hora de creación del registro.',
    example: '2026-07-12T16:05:45.000Z',
  })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización del registro.',
    example: '2026-07-12T16:05:45.000Z',
  })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Ticket asociado a esta respuesta.',
    type: () => Ticket,
  })
  @OneToOne(() => Ticket, (ticket) => ticket.response, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn()
  ticket: Ticket;

  @ApiProperty({
    description: 'Gerente del centro de cómputo que valida la respuesta.',
    type: () => ComputingCenterManager,
  })
  @Index()
  @ManyToOne(
    () => ComputingCenterManager,
    (computingCenterManager) => computingCenterManager.responses,
    {
      onDelete: 'RESTRICT',
    },
  )
  computing_center_manager: ComputingCenterManager;

  @ApiProperty({
    description: 'Tipo de mantenimiento realizado.',
    type: () => MaintenanceType,
  })
  @Index()
  @ManyToOne(
    () => MaintenanceType,
    (maintenanceType) => maintenanceType.reports,
    {
      onDelete: 'RESTRICT',
    },
  )
  maintenance_type: MaintenanceType;

  @ApiProperty({
    description: 'Tipo de servicio proporcionado.',
    type: () => ServiceType,
  })
  @Index()
  @ManyToOne(() => ServiceType, (serviceType) => serviceType.responses, {
    onDelete: 'RESTRICT',
  })
  service_type: ServiceType;

  @ApiProperty({
    description: 'Lista de firmas digitales asociadas a esta respuesta.',
    type: () => [ResponseSignature],
  })
  @OneToMany(
    () => ResponseSignature,
    (responseSignature) => responseSignature.response,
  )
  signatures: ResponseSignature[];
}
