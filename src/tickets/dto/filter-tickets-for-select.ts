import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsArray, ArrayNotEmpty } from 'class-validator';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';
import { Transform } from 'class-transformer';

export class FilterTicketsForSelectDto {
  @ApiProperty({
    description: 'Arreglo de estados de los tickets para filtrar la selección.',
    enum: TicketStatus,
    isArray: true,
    example: [TicketStatus.ATENDIENDO, TicketStatus.ASIGNADA],
  })
  @Transform(({ value }) =>
    Array.isArray(value) ? (value as TicketStatus[]) : [value as TicketStatus],
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(TicketStatus, { each: true })
  status: TicketStatus[];
}
