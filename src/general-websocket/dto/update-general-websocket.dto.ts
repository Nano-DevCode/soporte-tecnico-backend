import { PartialType } from '@nestjs/mapped-types';
import { CreateGeneralWebsocketDto } from './create-general-websocket.dto';

export class UpdateGeneralWebsocketDto extends PartialType(
  CreateGeneralWebsocketDto,
) {
  id: number;
}
