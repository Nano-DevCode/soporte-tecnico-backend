import { Module } from '@nestjs/common';
import { RoleSeedService } from './role-seed.service';
import { RoleSeedController } from './role-seed.controller';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [RoleSeedController],
  providers: [RoleSeedService],
  imports: [RolesModule, AuthModule],
})
export class RoleSeedModule {}
