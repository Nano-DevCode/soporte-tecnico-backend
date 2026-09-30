import { Module } from '@nestjs/common';
import { CoordinationSeedService } from './coordination-seed.service';
import { CoordinationSeedController } from './coordination-seed.controller';
import { CoordinationsModule } from 'src/coordinations/coordinations.module';

@Module({
  controllers: [CoordinationSeedController],
  providers: [CoordinationSeedService],
  imports: [CoordinationsModule],
})
export class CoordinationSeedModule {}
