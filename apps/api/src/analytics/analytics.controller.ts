import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('cash-flow')
  getCashFlow(
    @CurrentUser('id') userId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getCashFlow(userId, query.months);
  }

  @Get('category-breakdown')
  getCategoryBreakdown(
    @CurrentUser('id') userId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getCategoryBreakdown(
      userId,
      query.month,
      query.year,
    );
  }

  @Get('overview')
  getOverview(@CurrentUser('id') userId: string) {
    return this.analyticsService.getIncomeVsExpenseSummary(userId);
  }
}
