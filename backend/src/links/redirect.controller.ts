import {
  Controller,
  Get,
  GoneException,
  NotFoundException,
  Param,
  Redirect,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { LinksService } from './links.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';

@Controller()
export class RedirectController {
  constructor(
    private readonly linksService: LinksService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Public short-link redirect.
   *
   * Security considerations:
   * - Non-existent codes return 404 (not 500/DB error) — no information leakage.
   * - Disabled links return 410 Gone — not 404, to distinguish "never existed"
   *   from "existed but turned off". The distinction helps legitimate users.
   * - Expired links return 410 Gone with a human-readable message.
   * - The redirect target (originalUrl) has already been validated as http/https
   *   at creation time, so no scheme-checking is needed here.
   * - No internal link data (userId, DB ids) is exposed in any error response.
   *
   * Click recording is fire-and-forget: analytics errors never block the redirect.
   */
  @Get(':shortCode')
  @Redirect()
  async redirect(@Param('shortCode') shortCode: string, @Req() req: Request) {
    const link = await this.linksService.findByShortCode(shortCode);

    if (!link) {
      throw new NotFoundException('Short link not found');
    }

    if (!link.isActive) {
      throw new GoneException('This link has been disabled');
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new GoneException('This link has expired');
    }

    // Fire-and-forget: do NOT await so analytics never delays the redirect.
    void this.analyticsService.recordClick(
      link.id,
      (req.headers['x-forwarded-for'] as string | undefined) ?? req.ip,
      req.headers['user-agent'],
      (req.headers['referer'] ?? req.headers['referrer']) as string | undefined,
      req.headers['cf-ipcountry'] as string | undefined, // Cloudflare/CDN country header
    );

    return { url: link.originalUrl, statusCode: 302 };
  }
}
