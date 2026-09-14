import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ActivityService } from "./activity.service";
import { ActivityQueryDto } from "./dto";

@UseGuards(JwtAuthGuard)
@Controller("activity")
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findAll(
    @CurrentUser("id") userId: string,
    @Query() query: ActivityQueryDto,
  ) {
    return this.activityService.findAll(userId, query);
  }
}
