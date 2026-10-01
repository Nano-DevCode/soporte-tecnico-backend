import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoordinationsService } from './services/coordinations.service';
import { CoordinationsController } from './controllers/coordinations.controller';
import { Coordination } from './entities/coordination.entity';
import { CoordinationSeedService } from './seed/coordination-seed.service';
import { CoordinationSeedController } from './seed/coordination-seed.controller';

@Module({
  controllers: [CoordinationsController, CoordinationSeedController],
  providers: [CoordinationsService, CoordinationSeedService],
  imports: [TypeOrmModule.forFeature([Coordination])],
  exports: [CoordinationsService, CoordinationSeedService, TypeOrmModule],
})
export class CoordinationsModule {}
