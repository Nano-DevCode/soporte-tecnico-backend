import { Module } from '@nestjs/common';
import { UserSeedService } from './user-seed.service';
import { UserSeedController } from './user-seed.controller';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { DepartmentsModule } from 'src/departments/departments.module';
import { CoordinationsModule } from 'src/coordinations/coordinations.module';
import { StaffModule } from 'src/staff/staff.module';

@Module({
  controllers: [UserSeedController],
  providers: [UserSeedService],
  imports: [
    UsersModule,
    RolesModule,
    CoordinationsModule,
    DepartmentsModule,
    StaffModule,
  ],
})
export class UserSeedModule {}
