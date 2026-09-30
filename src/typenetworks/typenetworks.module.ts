import { Module } from '@nestjs/common';
import { TypenetworksService } from './typenetworks.service';
import { TypenetworksController } from './typenetworks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Typenetwork } from './entities/typenetwork.entity';
@Module({
  controllers: [TypenetworksController],
  providers: [TypenetworksService],
  imports: [TypeOrmModule.forFeature([Typenetwork])],
  exports: [TypenetworksService],
})
export class TypenetworksModule {}
