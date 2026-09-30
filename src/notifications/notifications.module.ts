import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsListener } from './notifications.listener';
import { Notification } from './entities/notification.entity';
import { AuthModule } from '../auth/auth.module';
import { GeneralWebsocketModule } from '../general-websocket/general-websocket.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    AuthModule,
    GeneralWebsocketModule,
    UsersModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsProcessor,
    NotificationsListener,
  ],
  exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule {}
