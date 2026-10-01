import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TelegramNotificationOptions } from '../interfaces/telegram-job.interface';

export class SendTelegramDto {
  @ApiProperty({
    description: 'Identificador del chat o usuario de Telegram',
    example: '123456789',
  })
  @IsNotEmpty({ message: 'El chatId no puede estar vacío' })
  chatId!: string;

  @ApiProperty({
    description: 'Mensaje formateado en HTML para enviar a Telegram',
    example: '<b>Nuevo Ticket Asignado:</b> #123',
  })
  @IsString({ message: 'El mensaje debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  message!: string;

  @ApiPropertyOptional({
    description: 'Opciones de teclado o markup de Telegram',
    type: () => TelegramNotificationOptions,
  })
  @IsOptional()
  options?: TelegramNotificationOptions;
}
