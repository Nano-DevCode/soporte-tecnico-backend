import { Module } from '@nestjs/common';
import { StoragetypesService } from './storagetypes.service';
import { StoragetypesController } from './storagetypes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Storagetype } from './entities/storagetype.entity';

@Module({
  controllers: [StoragetypesController],
  providers: [StoragetypesService],
  imports: [TypeOrmModule.forFeature([Storagetype])],
  exports: [StoragetypesService],
})
export class StoragetypesModule {}
