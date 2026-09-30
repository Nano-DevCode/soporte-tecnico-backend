import { Module } from '@nestjs/common';
import { ComputersService } from './computers.service';
import { ComputersController } from './computers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Computer } from './entities/computer.entity';
@Module({
  controllers: [ComputersController],
  providers: [ComputersService],
  imports: [TypeOrmModule.forFeature([Computer])],
  exports: [ComputersService],
})
export class ComputersModule {}
