import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Click } from './entities/click.entity.js';
import { Link } from '../links/entities/link.entity.js';
import { DateRangeQueryDto, DateRangePreset, resolveDateRange } from './dto/date-range.dto.js';

// ─── Response interfaces ──────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
}

export interface TimelineItem {
  date: string;
  clicks: number;
}

export interface GroupedAnalyticsItem {
  name: string;
  clicks: number;
}

export interface RecentClickItem {
  id: string;
  linkShortCode: string;
  device: string | null;
  browser: string | null;
  country: string | null;
  referrer: string | null;
  timestamp: string;
}

export interface TopLinkItem {
  id: string;
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  isActive: boolean;
}

export interface RecentLinkItem {
  id: string;
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface OverviewResponse {
  totalClicks: number;
  clicksToday: number;
  totalLinks: number;
  activeLinks: number;
  linksThisMonth: number;
  timeline: TimelineItem[];
  devices: GroupedAnalyticsItem[];
  browsers: GroupedAnalyticsItem[];
  countries: GroupedAnalyticsItem[];
  topLinks: TopLinkItem[];
  recentLinks: RecentLinkItem[];
  rangeInfo?: {
    range: DateRangePreset;
    startDate: string | null;
    endDate: string | null;
    timezone: string;
  };
}

// ─── Internal ─────────────────────────────────────────────────────────────────

/** Minimal request metadata extracted from HTTP headers without external libs. */
interface ParsedClickMeta {
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
  device: string;
  browser: string;
  country: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Click)
    private readonly clickRepository: Repository<Click>,
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {}

  // ─── Click Recording ─────────────────────────────────────────────────────────

  /**
   * Parse minimal click metadata from raw HTTP request values.
   *
   * Uses regex matching instead of an external library to keep dependencies
   * minimal. Accuracy is "good enough" for a URL shortener dashboard:
   * broad device/browser categories rather than precise version strings.
   */
  private parseClickMeta(
    rawIp: string | undefined,
    rawUa: string | undefined,
    rawReferrer: string | undefined,
    rawCountry: string | undefined,
  ): ParsedClickMeta {
    const userAgent = rawUa?.slice(0, 500) ?? null;

    // ── Device detection ─────────────────────────────────────────────────────
    let device = 'Desktop';
    if (userAgent) {
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        device = 'Tablet';
      } else if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent)) {
        device = 'Mobile';
      }
    }

    // ── Browser detection ────────────────────────────────────────────────────
    let browser = 'Unknown';
    if (userAgent) {
      if (/edg\//i.test(userAgent)) {
        browser = 'Edge';
      } else if (/opr\/|opera/i.test(userAgent)) {
        browser = 'Opera';
      } else if (/chrome|chromium/i.test(userAgent) && !/edg\//i.test(userAgent)) {
        browser = 'Chrome';
      } else if (/firefox|fxios/i.test(userAgent)) {
        browser = 'Firefox';
      } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
        browser = 'Safari';
      } else if (/msie|trident/i.test(userAgent)) {
        browser = 'IE';
      }
    }

    // ── IP extraction (handle proxies / X-Forwarded-For) ─────────────────────
    let ipAddress: string | null = null;
    if (rawIp) {
      // Take only the first IP if comma-separated (common in reverse proxies)
      ipAddress = rawIp.split(',')[0]?.trim() ?? null;
    }

    // ── Referrer normalisation ────────────────────────────────────────────────
    const referrer = rawReferrer?.slice(0, 500) ?? null;

    // ── Country (from CDN/proxy header, null if not forwarded) ────────────────
    const country = rawCountry?.slice(0, 100) ?? null;

    return { ipAddress, userAgent, referrer, device, browser, country };
  }

  /**
   * Record a click for a short-link visit.
   *
   * Called by RedirectController after the link is resolved.
   * Fire-and-forget: the caller does NOT await this so analytics errors can
   * never block or delay the actual HTTP redirect.
   */
  async recordClick(
    linkId: string,
    rawIp: string | undefined,
    rawUa: string | undefined,
    rawReferrer: string | undefined,
    rawCountry?: string,
  ): Promise<void> {
    try {
      const meta = this.parseClickMeta(rawIp, rawUa, rawReferrer, rawCountry);
      const click = this.clickRepository.create({
        linkId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        referrer: meta.referrer,
        device: meta.device,
        browser: meta.browser,
        country: meta.country,
      });
      await this.clickRepository.save(click);
    } catch (err) {
      // Never propagate — analytics errors must not affect redirect availability.
      this.logger.error(`Failed to record click for link ${linkId}: ${String(err)}`);
    }
  }

  async validateLinkOwnership(linkId: string, userId: string): Promise<Link> {
    const link = await this.linkRepository.findOne({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Link not found');
    if (link.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access analytics for this link');
    }
    return link;
  }

  /**
   * Return the most recent clicks across ALL of the user's links.
   *
   * Scoped to the authenticated user via a JOIN on links.user_id — no
   * click from another user's link can appear in the result set.
   */
  async getRecentClicks(userId: string, limit = 20): Promise<RecentClickItem[]> {
    const rows = await this.clickRepository
      .createQueryBuilder('click')
      .innerJoin('click.link', 'link')
      .addSelect(['link.short_code'])
      .where('link.user_id = :userId', { userId })
      .orderBy('click.timestamp', 'DESC')
      .limit(limit)
      .getRawMany<{
        click_id: string;
        click_timestamp: Date;
        click_device: string | null;
        click_browser: string | null;
        click_country: string | null;
        click_referrer: string | null;
        link_short_code: string;
      }>();

    return rows.map((r) => ({
      id: r.click_id,
      linkShortCode: r.link_short_code ?? '',
      device: r.click_device,
      browser: r.click_browser,
      country: r.click_country,
      referrer: r.click_referrer,
      timestamp: (r.click_timestamp instanceof Date
        ? r.click_timestamp
        : new Date(r.click_timestamp)
      ).toISOString(),
    }));
  }



  async getSummary(linkId: string, userId: string): Promise<AnalyticsSummary> {
    await this.validateLinkOwnership(linkId, userId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const totalClicks = await this.clickRepository.count({ where: { linkId } });

    const clicksToday = await this.clickRepository
      .createQueryBuilder('click')
      .where('click.link_id = :linkId', { linkId })
      .andWhere('click.timestamp >= :startOfToday', { startOfToday })
      .getCount();

    const clicksThisWeek = await this.clickRepository
      .createQueryBuilder('click')
      .where('click.link_id = :linkId', { linkId })
      .andWhere('click.timestamp >= :startOfWeek', { startOfWeek })
      .getCount();

    const clicksThisMonth = await this.clickRepository
      .createQueryBuilder('click')
      .where('click.link_id = :linkId', { linkId })
      .andWhere('click.timestamp >= :startOfMonth', { startOfMonth })
      .getCount();

    return { totalClicks, clicksToday, clicksThisWeek, clicksThisMonth };
  }

  async getTimeline(
    linkId: string,
    userId: string,
    query?: DateRangeQueryDto,
  ): Promise<TimelineItem[]> {
    await this.validateLinkOwnership(linkId, userId);
    const { startDateTime, endDateTime, timezone } = resolveDateRange(query);

    const qb = this.clickRepository
      .createQueryBuilder('click')
      .select(`TO_CHAR(click.timestamp AT TIME ZONE :timezone, 'YYYY-MM-DD')`, 'date')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('click.link_id = :linkId', { linkId })
      .setParameter('timezone', timezone);

    if (startDateTime) {
      qb.andWhere('click.timestamp >= :startDateTime', { startDateTime });
    }
    if (endDateTime) {
      qb.andWhere('click.timestamp <= :endDateTime', { endDateTime });
    }

    const rows = await qb
      .groupBy(`TO_CHAR(click.timestamp AT TIME ZONE :timezone, 'YYYY-MM-DD')`)
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; clicks: number }>();

    return buildContinuousTimeline(rows, startDateTime, endDateTime, timezone);
  }

  async getDevices(
    linkId: string,
    userId: string,
    query?: DateRangeQueryDto,
  ): Promise<GroupedAnalyticsItem[]> {
    await this.validateLinkOwnership(linkId, userId);
    const { startDateTime, endDateTime } = resolveDateRange(query);

    const qb = this.clickRepository
      .createQueryBuilder('click')
      .select("COALESCE(click.device, 'Unknown')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('click.link_id = :linkId', { linkId });

    if (startDateTime) {
      qb.andWhere('click.timestamp >= :startDateTime', { startDateTime });
    }
    if (endDateTime) {
      qb.andWhere('click.timestamp <= :endDateTime', { endDateTime });
    }

    const result = await qb
      .groupBy("COALESCE(click.device, 'Unknown')")
      .orderBy('clicks', 'DESC')
      .getRawMany<{ name: string; clicks: number }>();

    return result.map((row) => ({ name: row.name, clicks: Number(row.clicks) }));
  }

  async getBrowsers(
    linkId: string,
    userId: string,
    query?: DateRangeQueryDto,
  ): Promise<GroupedAnalyticsItem[]> {
    await this.validateLinkOwnership(linkId, userId);
    const { startDateTime, endDateTime } = resolveDateRange(query);

    const qb = this.clickRepository
      .createQueryBuilder('click')
      .select("COALESCE(click.browser, 'Unknown')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('click.link_id = :linkId', { linkId });

    if (startDateTime) {
      qb.andWhere('click.timestamp >= :startDateTime', { startDateTime });
    }
    if (endDateTime) {
      qb.andWhere('click.timestamp <= :endDateTime', { endDateTime });
    }

    const result = await qb
      .groupBy("COALESCE(click.browser, 'Unknown')")
      .orderBy('clicks', 'DESC')
      .getRawMany<{ name: string; clicks: number }>();

    return result.map((row) => ({ name: row.name, clicks: Number(row.clicks) }));
  }

  async getReferrers(
    linkId: string,
    userId: string,
    query?: DateRangeQueryDto,
  ): Promise<GroupedAnalyticsItem[]> {
    await this.validateLinkOwnership(linkId, userId);
    const { startDateTime, endDateTime } = resolveDateRange(query);

    const qb = this.clickRepository
      .createQueryBuilder('click')
      .select("COALESCE(click.referrer, 'Direct / None')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('click.link_id = :linkId', { linkId });

    if (startDateTime) {
      qb.andWhere('click.timestamp >= :startDateTime', { startDateTime });
    }
    if (endDateTime) {
      qb.andWhere('click.timestamp <= :endDateTime', { endDateTime });
    }

    const result = await qb
      .groupBy("COALESCE(click.referrer, 'Direct / None')")
      .orderBy('clicks', 'DESC')
      .getRawMany<{ name: string; clicks: number }>();

    return result.map((row) => ({ name: row.name, clicks: Number(row.clicks) }));
  }

  async getCountries(
    linkId: string,
    userId: string,
    query?: DateRangeQueryDto,
  ): Promise<GroupedAnalyticsItem[]> {
    await this.validateLinkOwnership(linkId, userId);
    const { startDateTime, endDateTime } = resolveDateRange(query);

    const qb = this.clickRepository
      .createQueryBuilder('click')
      .select("COALESCE(click.country, 'Unknown')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('click.link_id = :linkId', { linkId });

    if (startDateTime) {
      qb.andWhere('click.timestamp >= :startDateTime', { startDateTime });
    }
    if (endDateTime) {
      qb.andWhere('click.timestamp <= :endDateTime', { endDateTime });
    }

    const result = await qb
      .groupBy("COALESCE(click.country, 'Unknown')")
      .orderBy('clicks', 'DESC')
      .getRawMany<{ name: string; clicks: number }>();

    return result.map((row) => ({ name: row.name, clicks: Number(row.clicks) }));
  }

  /**
   * Aggregate analytics for ALL links owned by a user in a single roundtrip.
   *
   * Runs 7 queries in parallel (Promise.all) — each is a single SQL aggregate
   * joined from clicks through links.user_id. No per-link fanout.
   */
  /**
   * Aggregate analytics for ALL links owned by a user in a single roundtrip.
   *
   * Runs queries in parallel (Promise.all) — each is a single SQL aggregate
   * joined from clicks through links.user_id, filtered by the requested date range.
   */
  async getOverview(userId: string, query?: DateRangeQueryDto): Promise<OverviewResponse> {
    const { range, startDateTime, endDateTime, timezone } = resolveDateRange(query);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total clicks in range
    const totalClicksQb = this.clickRepository
      .createQueryBuilder('click')
      .innerJoin('click.link', 'link')
      .where('link.user_id = :userId', { userId });
    if (startDateTime) {
      totalClicksQb.andWhere('click.timestamp >= :startDateTime', { startDateTime });
    }
    if (endDateTime) {
      totalClicksQb.andWhere('click.timestamp <= :endDateTime', { endDateTime });
    }

    // 2. Timeline in range
    const timelineQb = this.clickRepository
      .createQueryBuilder('click')
      .innerJoin('click.link', 'link')
      .select(`TO_CHAR(click.timestamp AT TIME ZONE :timezone, 'YYYY-MM-DD')`, 'date')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('link.user_id = :userId', { userId })
      .setParameter('timezone', timezone);
    if (startDateTime) {
      timelineQb.andWhere('click.timestamp >= :startDateTime', { startDateTime });
    }
    if (endDateTime) {
      timelineQb.andWhere('click.timestamp <= :endDateTime', { endDateTime });
    }
    timelineQb
      .groupBy(`TO_CHAR(click.timestamp AT TIME ZONE :timezone, 'YYYY-MM-DD')`)
      .orderBy('date', 'ASC');

    // 3. Devices in range
    const devicesQb = this.clickRepository
      .createQueryBuilder('click')
      .innerJoin('click.link', 'link')
      .select("COALESCE(click.device, 'Unknown')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('link.user_id = :userId', { userId });
    if (startDateTime) {
      devicesQb.andWhere('click.timestamp >= :startDateTime', { startDateTime });
    }
    if (endDateTime) {
      devicesQb.andWhere('click.timestamp <= :endDateTime', { endDateTime });
    }
    devicesQb
      .groupBy("COALESCE(click.device, 'Unknown')")
      .orderBy('clicks', 'DESC');

    // 4. Browsers in range
    const browsersQb = this.clickRepository
      .createQueryBuilder('click')
      .innerJoin('click.link', 'link')
      .select("COALESCE(click.browser, 'Unknown')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('link.user_id = :userId', { userId });
    if (startDateTime) {
      browsersQb.andWhere('click.timestamp >= :startDateTime', { startDateTime });
    }
    if (endDateTime) {
      browsersQb.andWhere('click.timestamp <= :endDateTime', { endDateTime });
    }
    browsersQb
      .groupBy("COALESCE(click.browser, 'Unknown')")
      .orderBy('clicks', 'DESC');

    // 5. Countries in range
    const countriesQb = this.clickRepository
      .createQueryBuilder('click')
      .innerJoin('click.link', 'link')
      .select("COALESCE(click.country, 'Unknown')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('link.user_id = :userId', { userId });
    if (startDateTime) {
      countriesQb.andWhere('click.timestamp >= :startDateTime', { startDateTime });
    }
    if (endDateTime) {
      countriesQb.andWhere('click.timestamp <= :endDateTime', { endDateTime });
    }
    countriesQb
      .groupBy("COALESCE(click.country, 'Unknown')")
      .orderBy('clicks', 'DESC');

    // 6. Top links by click count IN SELECTED RANGE
    let topLinksJoinCondition = '1=1';
    const topLinksParams: Record<string, any> = {};
    if (startDateTime) {
      topLinksJoinCondition += ' AND click.timestamp >= :startDateTime';
      topLinksParams.startDateTime = startDateTime;
    }
    if (endDateTime) {
      topLinksJoinCondition += ' AND click.timestamp <= :endDateTime';
      topLinksParams.endDateTime = endDateTime;
    }
    const topLinksQb = this.linkRepository
      .createQueryBuilder('link')
      .leftJoin('link.clicks', 'click', topLinksJoinCondition, topLinksParams)
      .select(['link.id', 'link.short_code', 'link.original_url', 'link.is_active'])
      .addSelect('COUNT(click.id)::int', 'clickCount')
      .where('link.user_id = :userId', { userId })
      .groupBy('link.id')
      .orderBy('clickCount', 'DESC')
      .addOrderBy('link.created_at', 'DESC')
      .limit(5);

    const [
      totalClicksResult,
      clicksTodayResult,
      rawTimeline,
      devices,
      browsers,
      countries,
      topLinks,
      recentLinks,
      linksCounts,
    ] = await Promise.all([
      totalClicksQb.getCount(),

      // Clicks today (unfiltered by custom range to give current pulse)
      this.clickRepository
        .createQueryBuilder('click')
        .innerJoin('click.link', 'link')
        .where('link.user_id = :userId', { userId })
        .andWhere('click.timestamp >= :startOfToday', { startOfToday })
        .getCount(),

      timelineQb.getRawMany<{ date: string; clicks: number }>(),
      devicesQb.getRawMany<{ name: string; clicks: number }>(),
      browsersQb.getRawMany<{ name: string; clicks: number }>(),
      countriesQb.getRawMany<{ name: string; clicks: number }>(),
      topLinksQb.getRawAndEntities(),

      // 5 most recently created links
      this.linkRepository
        .createQueryBuilder('link')
        .leftJoin('link.clicks', 'click')
        .select(['link.id', 'link.short_code', 'link.original_url', 'link.is_active', 'link.created_at'])
        .addSelect('COUNT(click.id)::int', 'clickCount')
        .where('link.user_id = :userId', { userId })
        .groupBy('link.id')
        .orderBy('link.created_at', 'DESC')
        .limit(5)
        .getRawAndEntities(),

      // Total & active link counts + links created this month
      this.linkRepository
        .createQueryBuilder('link')
        .select('COUNT(*)::int', 'total')
        .addSelect('SUM(CASE WHEN link.is_active THEN 1 ELSE 0 END)::int', 'active')
        .addSelect(
          'SUM(CASE WHEN link.created_at >= :startOfMonth THEN 1 ELSE 0 END)::int',
          'thisMonth',
        )
        .where('link.user_id = :userId', { userId })
        .setParameter('startOfMonth', startOfMonth)
        .getRawOne<{ total: number; active: number; thisMonth: number }>(),
    ]);

    const mapLinkEntities = (
      result: Awaited<typeof topLinks>,
      raw: { clickCount: number }[],
    ): TopLinkItem[] =>
      result.entities.map((link, idx) => ({
        id: link.id,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        clickCount: Number(raw[idx]?.clickCount ?? 0),
        isActive: link.isActive,
      }));

    return {
      totalClicks: Number(totalClicksResult),
      clicksToday: Number(clicksTodayResult),
      totalLinks: Number(linksCounts?.total ?? 0),
      activeLinks: Number(linksCounts?.active ?? 0),
      linksThisMonth: Number(linksCounts?.thisMonth ?? 0),
      timeline: buildContinuousTimeline(rawTimeline, startDateTime, endDateTime, timezone),
      devices: devices.map((r) => ({ name: r.name, clicks: Number(r.clicks) })),
      browsers: browsers.map((r) => ({ name: r.name, clicks: Number(r.clicks) })),
      countries: countries.map((r) => ({ name: r.name, clicks: Number(r.clicks) })),
      topLinks: mapLinkEntities(topLinks, topLinks.raw as { clickCount: number }[]),
      recentLinks: recentLinks.entities.map((link, idx) => ({
        id: link.id,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        clickCount: Number((recentLinks.raw as { clickCount: number }[])[idx]?.clickCount ?? 0),
        isActive: link.isActive,
        createdAt: link.createdAt.toISOString(),
      })),
      rangeInfo: {
        range,
        startDate: startDateTime ? startDateTime.toISOString() : null,
        endDate: endDateTime ? endDateTime.toISOString() : null,
        timezone,
      },
    };
  }
}

/**
 * Ensures dates within the selected range are represented continuously with 0 for missing days.
 */
function buildContinuousTimeline(
  rows: { date: string; clicks: number }[],
  startDateTime: Date | null,
  endDateTime: Date | null,
  timezone: string,
): TimelineItem[] {
  const dateMap = new Map<string, number>();
  for (const r of rows) {
    dateMap.set(r.date, Number(r.clicks));
  }

  if (startDateTime && endDateTime) {
    const cur = new Date(startDateTime);
    let count = 0;
    while (cur <= endDateTime && count < 3660) {
      count++;
      const dateStr = cur.toLocaleDateString('en-CA', { timeZone: timezone });
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, 0);
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }

  return Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, clicks]) => ({ date, clicks }));
}
