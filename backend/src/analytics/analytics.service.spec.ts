import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AnalyticsService } from './analytics.service.js';
import { Click } from './entities/click.entity.js';
import { Link } from '../links/entities/link.entity.js';
import { resolveDateRange } from './dto/date-range.dto.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let linkRepo: any;
  let clickRepo: any;

  beforeEach(async () => {
    linkRepo = {
      findOne: vi.fn(),
    };

    clickRepo = {
      count: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(Link), useValue: linkRepo },
        { provide: getRepositoryToken(Click), useValue: clickRepo },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('validateLinkOwnership', () => {
    it('should throw NotFoundException if link does not exist', async () => {
      linkRepo.findOne.mockResolvedValue(null);

      await expect(service.validateLinkOwnership('link-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if link does not belong to user', async () => {
      linkRepo.findOne.mockResolvedValue({ id: 'link-1', userId: 'other-user' });

      await expect(service.validateLinkOwnership('link-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return link if user owns it', async () => {
      const mockLink = { id: 'link-1', userId: 'user-1' };
      linkRepo.findOne.mockResolvedValue(mockLink);

      const result = await service.validateLinkOwnership('link-1', 'user-1');
      expect(result).toBe(mockLink);
    });
  });

  describe('getSummary', () => {
    it('should return aggregated click counts for today, week, and month', async () => {
      linkRepo.findOne.mockResolvedValue({ id: 'link-1', userId: 'user-1' });
      clickRepo.count.mockResolvedValue(128);

      const qbMock = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValueOnce(17).mockResolvedValueOnce(74).mockResolvedValueOnce(128),
      };
      clickRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.getSummary('link-1', 'user-1');

      expect(result).toEqual({
        totalClicks: 128,
        clicksToday: 17,
        clicksThisWeek: 74,
        clicksThisMonth: 128,
      });
    });
  });

  describe('resolveDateRange', () => {
    it('should default to 30d with UTC when no parameters provided', () => {
      const resolved = resolveDateRange({});
      expect(resolved.range).toBe('30d');
      expect(resolved.timezone).toBe('UTC');
      expect(resolved.startDateTime).toBeInstanceOf(Date);
      expect(resolved.endDateTime).toBeInstanceOf(Date);
    });

    it('should correctly handle all-time preset', () => {
      const resolved = resolveDateRange({ range: 'all' });
      expect(resolved.range).toBe('all');
      expect(resolved.startDateTime).toBeNull();
      expect(resolved.endDateTime).toBeNull();
    });

    it('should validate and parse custom date range', () => {
      const resolved = resolveDateRange({
        range: 'custom',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        timezone: 'America/New_York',
      });
      expect(resolved.range).toBe('custom');
      expect(resolved.timezone).toBe('America/New_York');
      expect(resolved.startDateTime?.toISOString()).toBe('2026-09-01T00:00:00.000Z');
      expect(resolved.endDateTime?.toISOString()).toBe('2026-09-30T23:59:59.999Z');
    });

    it('should throw BadRequestException if startDate is after endDate', () => {
      expect(() =>
        resolveDateRange({
          range: 'custom',
          startDate: '2026-10-05',
          endDate: '2026-10-01',
        }),
      ).toThrow();
    });

    it('should throw BadRequestException for invalid timezone', () => {
      expect(() =>
        resolveDateRange({
          range: '7d',
          timezone: 'Not/A_Real_Timezone',
        }),
      ).toThrow();
    });

    it('should validate with NestJS ValidationPipe without throwing non-whitelisted property errors', async () => {
      const { ValidationPipe } = await import('@nestjs/common');
      const { plainToInstance } = await import('class-transformer');
      const { validate } = await import('class-validator');
      const { DateRangeQueryDto } = await import('./dto/date-range.dto.js');

      const dto = plainToInstance(DateRangeQueryDto, {
        range: '30d',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        timezone: 'Asia/Dhaka',
      });

      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      expect(errors).toHaveLength(0);
      expect(dto.range).toBe('30d');
      expect(dto.timezone).toBe('Asia/Dhaka');
    });
  });
});
