import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { GmailBotModule } from 'src/gmail-bot/gmail-bot.module';
import { AuthModule } from 'src/auth/auth.module';
import { CoordinationsModule } from 'src/coordinations/coordinations.module';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    TypeOrmModule.forFeature([User]),
    GmailBotModule,
    forwardRef(() => AuthModule),
    CoordinationsModule,
    RolesModule,
  ],
  exports: [UsersService],
})
export class UsersModule {}
