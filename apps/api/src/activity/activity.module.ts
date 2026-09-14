import { Module, Global } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { ActivityService } from "./activity.service";
import { ActivityController } from "./activity.controller";

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
