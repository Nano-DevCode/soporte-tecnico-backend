import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintersService } from './printers.service';
import { PrintersController } from './printers.controller';
import { Printer } from './entities/printer.entity';
import { PrinterfunctiontypesModule } from './function-types/printerfunctiontypes.module';
import { PrintingtypesModule } from './printing-types/printingtypes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Printer]),
    PrinterfunctiontypesModule,
    PrintingtypesModule,
  ],
  controllers: [PrintersController],
  providers: [PrintersService],
  exports: [
    PrintersService,
    TypeOrmModule,
    PrinterfunctiontypesModule,
    PrintingtypesModule,
  ],
})
export class PrintersModule {}
