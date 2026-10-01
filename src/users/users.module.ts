import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { UsersController } from './controllers/users.controller';
import { StaffController } from './controllers/staff.controller';
import { UserSeedController } from './seed/user-seed.controller';

import { User } from './entities/user.entity';
import { Staff } from './entities/staff.entity';
import { TechnicianKpi } from './entities/technician-kpi.entity';

import { GmailModule } from 'src/gmail/gmail.module';
import { AuthModule } from 'src/auth/auth.module';
import { CoordinationsModule } from 'src/coordinations/coordinations.module';
import { RolesModule } from 'src/auth/roles/roles.module';
import { DepartmentsModule } from 'src/departments/departments.module';

import { UsersService } from './services/users.service';
import { UserAccountService } from './services/user-account.service';
import { UserRegistrationService } from './services/user-registration.service';
import { StaffService } from './services/staff.service';
import { StaffQueriesService } from './services/staff-queries.service';
import { TechnicianKpiService } from './services/technician-kpi.service';
import { TechnicianKpiProcessor } from './processors/technician-kpi.processor';
import { UserSeedService } from './seed/user-seed.service';

@Module({
  controllers: [UsersController, StaffController, UserSeedController],
  providers: [
    UsersService,
    UserAccountService,
    UserRegistrationService,
    StaffService,
    StaffQueriesService,
    TechnicianKpiService,
    TechnicianKpiProcessor,
    UserSeedService,
  ],
  imports: [
    TypeOrmModule.forFeature([User, Staff, TechnicianKpi]),
    BullModule.registerQueue({
      name: 'kpi-queue',
    }),
    GmailModule,
    forwardRef(() => AuthModule),
    CoordinationsModule,
    RolesModule,
    forwardRef(() => DepartmentsModule),
  ],
  exports: [
    UsersService,
    UserAccountService,
    UserRegistrationService,
    StaffService,
    StaffQueriesService,
    TechnicianKpiService,
    UserSeedService,
  ],
})
export class UsersModule {}
