import { Module } from '@nestjs/common';
import { PrintingtypesService } from './printingtypes.service';
import { PrintingtypesController } from './printingtypes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Printingtype } from './entities/printingtype.entity';

@Module({
  controllers: [PrintingtypesController],
  providers: [PrintingtypesService],
  imports: [TypeOrmModule.forFeature([Printingtype])],
  exports: [PrintingtypesService],
})
export class PrintingtypesModule {}
