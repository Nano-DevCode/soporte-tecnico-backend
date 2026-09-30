import { Module } from '@nestjs/common';
import { AttendsService } from './attends.service';
import { AttendsController } from './attends.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attend } from './entities/attend.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attend])],
  controllers: [AttendsController],
  providers: [AttendsService],
  exports: [AttendsService],
})
export class AttendsModule {}
