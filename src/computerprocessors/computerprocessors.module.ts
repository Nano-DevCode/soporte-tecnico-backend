import { Module } from '@nestjs/common';
import { ComputerprocessorsService } from './computerprocessors.service';
import { ComputerprocessorsController } from './computerprocessors.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Computerprocessor } from './entities/computerprocessor.entity';
@Module({
  controllers: [ComputerprocessorsController],
  providers: [ComputerprocessorsService],
  imports: [TypeOrmModule.forFeature([Computerprocessor])],
  exports: [ComputerprocessorsService, TypeOrmModule],
})
export class ComputerprocessorsModule {}
