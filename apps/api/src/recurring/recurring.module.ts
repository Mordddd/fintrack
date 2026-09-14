import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RecurringService } from './recurring.service';
import { RecurringController } from './recurring.controller';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [RecurringService],
  controllers: [RecurringController],
})
export class RecurringModule {}
