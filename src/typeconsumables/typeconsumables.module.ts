import { Module } from '@nestjs/common';
import { TypeconsumablesService } from './typeconsumables.service';
import { TypeconsumablesController } from './typeconsumables.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Typeconsumable } from './entities/typeconsumable.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Typeconsumable])],
  controllers: [TypeconsumablesController],
  providers: [TypeconsumablesService],
  exports: [TypeconsumablesService, TypeOrmModule],
})
export class TypeconsumablesModule {}
