import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { User } from '../users/entities/user.entity.js';
import {
  AnalyticsService,
  AnalyticsSummary,
  GroupedAnalyticsItem,
  OverviewResponse,
  RecentClickItem,
  TimelineItem,
} from './analytics.service.js';
import { DateRangeQueryDto } from './dto/date-range.dto.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ─── Per-link analytics ───────────────────────────────────────────────────────

  @Get('links/:id/analytics')
  async getSummary(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'passwordHash'>,
  ): Promise<AnalyticsSummary> {
    return this.analyticsService.getSummary(id, user.id);
  }

  @Get('links/:id/analytics/timeline')
  async getTimeline(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Query() query: DateRangeQueryDto,
  ): Promise<TimelineItem[]> {
    return this.analyticsService.getTimeline(id, user.id, query);
  }

  @Get('links/:id/analytics/devices')
  async getDevices(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Query() query: DateRangeQueryDto,
  ): Promise<GroupedAnalyticsItem[]> {
    return this.analyticsService.getDevices(id, user.id, query);
  }

  @Get('links/:id/analytics/browsers')
  async getBrowsers(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Query() query: DateRangeQueryDto,
  ): Promise<GroupedAnalyticsItem[]> {
    return this.analyticsService.getBrowsers(id, user.id, query);
  }

  @Get('links/:id/analytics/referrers')
  async getReferrers(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Query() query: DateRangeQueryDto,
  ): Promise<GroupedAnalyticsItem[]> {
    return this.analyticsService.getReferrers(id, user.id, query);
  }

  @Get('links/:id/analytics/countries')
  async getCountries(
    @Param('id') id: string,
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Query() query: DateRangeQueryDto,
  ): Promise<GroupedAnalyticsItem[]> {
    return this.analyticsService.getCountries(id, user.id, query);
  }

  // ─── Global (user-scoped) analytics ──────────────────────────────────────────

  /**
   * Account-wide aggregated analytics in a single request.
   *
   * Replaces the N×4 per-link fanout the frontend previously performed.
   * Runs 9 parallel PostgreSQL queries (all joined on links.user_id)
   * and returns a single typed payload the dashboard hook consumes directly.
   */
  @Get('analytics/overview')
  async getOverview(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Query() query: DateRangeQueryDto,
  ): Promise<OverviewResponse> {
    return this.analyticsService.getOverview(user.id, query);
  }

  /**
   * Returns the most recent clicks across ALL of the authenticated user's links.
   * Used by the Real-time Activity panel on the analytics dashboard.
   *
   * ?limit=N (default 20, max 50)
   */
  @Get('analytics/recent')
  async getRecentClicks(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
    @Query('limit') limitStr?: string,
  ): Promise<RecentClickItem[]> {
    const limit = Math.min(parseInt(limitStr ?? '20', 10) || 20, 50);
    return this.analyticsService.getRecentClicks(user.id, limit);
  }
}
