import { Module } from '@nestjs/common';
import { PrinterfunctiontypesService } from './printerfunctiontypes.service';
import { PrinterfunctiontypesController } from './printerfunctiontypes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Printerfunctiontype } from './entities/printerfunctiontype.entity';

@Module({
  controllers: [PrinterfunctiontypesController],
  providers: [PrinterfunctiontypesService],
  imports: [TypeOrmModule.forFeature([Printerfunctiontype])],
  exports: [PrinterfunctiontypesService],
})
export class PrinterfunctiontypesModule {}
