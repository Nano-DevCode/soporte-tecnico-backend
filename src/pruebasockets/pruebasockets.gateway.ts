import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { PruebasocketsService } from './pruebasockets.service';
import { CreatePruebasocketDto } from './dto/create-pruebasocket.dto';
import { UpdatePruebasocketDto } from './dto/update-pruebasocket.dto';

@WebSocketGateway()
export class PruebasocketsGateway {
  constructor(private readonly pruebasocketsService: PruebasocketsService) {}

  @SubscribeMessage('createPruebasocket')
  create(@MessageBody() createPruebasocketDto: CreatePruebasocketDto) {
    return this.pruebasocketsService.create(createPruebasocketDto);
  }

  @SubscribeMessage('findAllPruebasockets')
  findAll() {
    return this.pruebasocketsService.findAll();
  }

  @SubscribeMessage('findOnePruebasocket')
  findOne(@MessageBody() id: number) {
    return this.pruebasocketsService.findOne(id);
  }

  @SubscribeMessage('updatePruebasocket')
  update(@MessageBody() updatePruebasocketDto: UpdatePruebasocketDto) {
    return this.pruebasocketsService.update(
      updatePruebasocketDto.id,
      updatePruebasocketDto,
    );
  }

  @SubscribeMessage('removePruebasocket')
  remove(@MessageBody() id: number) {
    return this.pruebasocketsService.remove(id);
  }
}
