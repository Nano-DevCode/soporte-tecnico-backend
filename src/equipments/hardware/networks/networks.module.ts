import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetworksService } from './networks.service';
import { NetworksController } from './networks.controller';
import { Network } from './entities/network.entity';
import { TypenetworksModule } from './types/typenetworks.module';

@Module({
  imports: [TypeOrmModule.forFeature([Network]), TypenetworksModule],
  controllers: [NetworksController],
  providers: [NetworksService],
  exports: [NetworksService, TypeOrmModule, TypenetworksModule],
})
export class NetworksModule {}
