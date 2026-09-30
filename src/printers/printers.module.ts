import { Module } from '@nestjs/common';
import { PrintersService } from './printers.service';
import { PrintersController } from './printers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Printer } from './entities/printer.entity';
@Module({
  controllers: [PrintersController],
  providers: [PrintersService],
  imports: [TypeOrmModule.forFeature([Printer])],
  exports: [PrintersService],
})
export class PrintersModule {}
