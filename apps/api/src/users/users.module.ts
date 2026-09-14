import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { ActivityModule } from "../activity/activity.module";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [DatabaseModule, ActivityModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
