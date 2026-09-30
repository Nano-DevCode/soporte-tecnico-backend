import { Module } from '@nestjs/common';
import { PruebasocketsService } from './pruebasockets.service';
import { PruebasocketsGateway } from './pruebasockets.gateway';

@Module({
  providers: [PruebasocketsGateway, PruebasocketsService],
})
export class PruebasocketsModule {}
