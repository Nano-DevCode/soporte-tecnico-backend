import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateAttendDto {
  @IsUUID()
  @IsNotEmpty()
  ticketId: string;

  @IsUUID()
  @IsNotEmpty()
  technicianId: string;
}
