import { Module } from '@nestjs/common';
import { DepartamentSeedService } from './departament-seed.service';
import { DepartamentSeedController } from './departament-seed.controller';
import { DepartmentsModule } from 'src/departments/departments.module';

@Module({
  controllers: [DepartamentSeedController],
  providers: [DepartamentSeedService],
  imports: [DepartmentsModule],
})
export class DepartamentSeedModule {}
