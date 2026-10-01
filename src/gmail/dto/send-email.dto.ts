import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    description: 'Dirección de correo electrónico del destinatario',
    example: 'usuario@dominio.edu.mx',
  })
  @IsEmail({}, { message: 'El destinatario debe ser un correo válido' })
  @IsNotEmpty({ message: 'El destinatario no puede estar vacío' })
  destinatario!: string;

  @ApiProperty({
    description: 'Asunto del correo electrónico',
    example: 'Notificación de Ticket #1234',
  })
  @IsString({ message: 'El asunto debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El asunto no puede estar vacío' })
  asunto!: string;

  @ApiProperty({
    description: 'Cuerpo del mensaje en formato texto o HTML parcial',
    example: 'Su ticket ha sido actualizado a estado En Proceso.',
  })
  @IsString({ message: 'El mensaje debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  mensaje!: string;
}
