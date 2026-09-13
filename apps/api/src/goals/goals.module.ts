import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';

@Module({
  imports: [DatabaseModule],
  providers: [GoalsService],
  controllers: [GoalsController],
})
export class GoalsModule {}
