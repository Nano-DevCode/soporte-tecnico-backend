import { Module } from '@nestjs/common';
import { OperatingsystemsService } from './operatingsystems.service';
import { OperatingsystemsController } from './operatingsystems.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operatingsystem } from './entities/operatingsystem.entity';
@Module({
  controllers: [OperatingsystemsController],
  providers: [OperatingsystemsService],
  imports: [TypeOrmModule.forFeature([Operatingsystem])],
  exports: [TypeOrmModule, OperatingsystemsService],
})
export class OperatingsystemsModule {}
