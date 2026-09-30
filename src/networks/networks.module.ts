import { Module } from '@nestjs/common';
import { NetworksService } from './networks.service';
import { NetworksController } from './networks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Network } from './entities/network.entity';
@Module({
  controllers: [NetworksController],
  providers: [NetworksService],
  imports: [TypeOrmModule.forFeature([Network])],
  exports: [NetworksService],
})
export class NetworksModule {}
