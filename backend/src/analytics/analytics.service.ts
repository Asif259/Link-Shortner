import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Click } from './entities/click.entity.js';
import { Link } from '../links/entities/link.entity.js';

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

  // ─── Ownership guard ─────────────────────────────────────────────────────────

  async validateLinkOwnership(linkId: string, userId: string): Promise<Link> {
    const link = await this.linkRepository.findOne({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Link not found');
    if (link.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access analytics for this link');
    }
    return link;
  }

  // ─── Analytics queries ───────────────────────────────────────────────────────

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

  async getTimeline(linkId: string, userId: string): Promise<TimelineItem[]> {
    await this.validateLinkOwnership(linkId, userId);

    const result = await this.clickRepository
      .createQueryBuilder('click')
      .select("TO_CHAR(click.timestamp, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('click.link_id = :linkId', { linkId })
      .groupBy("TO_CHAR(click.timestamp, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; clicks: number }>();

    return result.map((row) => ({ date: row.date, clicks: Number(row.clicks) }));
  }

  async getDevices(linkId: string, userId: string): Promise<GroupedAnalyticsItem[]> {
    await this.validateLinkOwnership(linkId, userId);

    const result = await this.clickRepository
      .createQueryBuilder('click')
      .select("COALESCE(click.device, 'Unknown')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('click.link_id = :linkId', { linkId })
      .groupBy("COALESCE(click.device, 'Unknown')")
      .orderBy('clicks', 'DESC')
      .getRawMany<{ name: string; clicks: number }>();

    return result.map((row) => ({ name: row.name, clicks: Number(row.clicks) }));
  }

  async getBrowsers(linkId: string, userId: string): Promise<GroupedAnalyticsItem[]> {
    await this.validateLinkOwnership(linkId, userId);

    const result = await this.clickRepository
      .createQueryBuilder('click')
      .select("COALESCE(click.browser, 'Unknown')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('click.link_id = :linkId', { linkId })
      .groupBy("COALESCE(click.browser, 'Unknown')")
      .orderBy('clicks', 'DESC')
      .getRawMany<{ name: string; clicks: number }>();

    return result.map((row) => ({ name: row.name, clicks: Number(row.clicks) }));
  }

  async getReferrers(linkId: string, userId: string): Promise<GroupedAnalyticsItem[]> {
    await this.validateLinkOwnership(linkId, userId);

    const result = await this.clickRepository
      .createQueryBuilder('click')
      .select("COALESCE(click.referrer, 'Direct / None')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('click.link_id = :linkId', { linkId })
      .groupBy("COALESCE(click.referrer, 'Direct / None')")
      .orderBy('clicks', 'DESC')
      .getRawMany<{ name: string; clicks: number }>();

    return result.map((row) => ({ name: row.name, clicks: Number(row.clicks) }));
  }

  async getCountries(linkId: string, userId: string): Promise<GroupedAnalyticsItem[]> {
    await this.validateLinkOwnership(linkId, userId);

    const result = await this.clickRepository
      .createQueryBuilder('click')
      .select("COALESCE(click.country, 'Unknown')", 'name')
      .addSelect('COUNT(*)::int', 'clicks')
      .where('click.link_id = :linkId', { linkId })
      .groupBy("COALESCE(click.country, 'Unknown')")
      .orderBy('clicks', 'DESC')
      .getRawMany<{ name: string; clicks: number }>();

    return result.map((row) => ({ name: row.name, clicks: Number(row.clicks) }));
  }
}
