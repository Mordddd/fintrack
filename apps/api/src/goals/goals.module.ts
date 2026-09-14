import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [GoalsService],
  controllers: [GoalsController],
})
export class GoalsModule {}
