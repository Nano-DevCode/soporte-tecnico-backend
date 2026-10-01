import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Role {
  @ApiProperty({
    description: 'Identificador único del rol',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre del rol (normalizado en minúsculas)',
    example: 'superadmin',
  })
  @Index()
  @Column('text', {
    unique: true,
  })
  name: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    select: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    select: false,
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Lista de usuarios que poseen este rol',
    type: () => [User],
  })
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
