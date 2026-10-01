import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesService } from './services/roles.service';
import { RolesController } from './controllers/roles.controller';
import { Role } from './entities/role.entity';
import { RoleSeedService } from './seed/role-seed.service';
import { RoleSeedController } from './seed/role-seed.controller';

@Module({
  controllers: [RolesController, RoleSeedController],
  providers: [RolesService, RoleSeedService],
  imports: [TypeOrmModule.forFeature([Role])],
  exports: [RolesService, RoleSeedService, TypeOrmModule],
})
export class RolesModule {}
