import { BadRequestException } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';

export type DateRangePreset = '7d' | '30d' | '90d' | 'all' | 'custom';

export class DateRangeQueryDto {
  @IsOptional()
  @IsString()
  range?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export interface ResolvedDateRange {
  range: DateRangePreset;
  startDateTime: Date | null;
  endDateTime: Date | null;
  timezone: string;
}

/**
 * Validates date-range query parameters and resolves concrete UTC Date boundaries
 * and target PostgreSQL grouping timezone.
 */
export function resolveDateRange(dto: DateRangeQueryDto = {}): ResolvedDateRange {
  // 1. Timezone validation
  let tz = 'UTC';
  if (dto.timezone && typeof dto.timezone === 'string') {
    const trimmedTz = dto.timezone.trim();
    if (!/^[A-Za-z0-9_+\-/]+$/.test(trimmedTz)) {
      throw new BadRequestException(`Invalid timezone format: "${dto.timezone}"`);
    }
    try {
      new Intl.DateTimeFormat(undefined, { timeZone: trimmedTz });
      tz = trimmedTz;
    } catch {
      throw new BadRequestException(`Unknown or unsupported IANA timezone: "${dto.timezone}"`);
    }
  }

  // 2. Normalize range keyword
  const rawRange = (dto.range ?? '').trim().toLowerCase();
  let preset: DateRangePreset = '30d';

  if (!rawRange) {
    preset = dto.startDate && dto.endDate ? 'custom' : '30d';
  } else if (rawRange === '7d' || rawRange === 'last-7-days' || rawRange === '7-days') {
    preset = '7d';
  } else if (rawRange === '30d' || rawRange === 'last-30-days' || rawRange === '30-days') {
    preset = '30d';
  } else if (rawRange === '90d' || rawRange === 'last-90-days' || rawRange === '90-days' || rawRange === '3-months') {
    preset = '90d';
  } else if (rawRange === 'all' || rawRange === 'all-time') {
    preset = 'all';
  } else if (rawRange === 'custom') {
    preset = 'custom';
  } else {
    throw new BadRequestException(
      `Invalid range parameter "${dto.range}". Supported values: 7d, 30d, 90d, all, custom`,
    );
  }

  // 3. Resolve date boundaries
  const now = new Date();

  if (preset === 'all') {
    return {
      range: 'all',
      startDateTime: null,
      endDateTime: null,
      timezone: tz,
    };
  }

  if (preset === '7d') {
    return {
      range: '7d',
      startDateTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDateTime: now,
      timezone: tz,
    };
  }

  if (preset === '30d') {
    return {
      range: '30d',
      startDateTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDateTime: now,
      timezone: tz,
    };
  }

  if (preset === '90d') {
    return {
      range: '90d',
      startDateTime: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      endDateTime: now,
      timezone: tz,
    };
  }

  // Preset is 'custom'
  if (!dto.startDate || !dto.endDate) {
    throw new BadRequestException('Both startDate and endDate are required when using custom range.');
  }

  const startStr = dto.startDate.trim();
  const endStr = dto.endDate.trim();

  // Validate YYYY-MM-DD or ISO 8601 format
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:?\d{2})?)?$/;
  if (!dateRegex.test(startStr) || !dateRegex.test(endStr)) {
    throw new BadRequestException('startDate and endDate must be in YYYY-MM-DD or ISO 8601 format.');
  }

  const startParsed = new Date(startStr.includes('T') ? startStr : `${startStr}T00:00:00.000Z`);
  const endParsed = new Date(endStr.includes('T') ? endStr : `${endStr}T23:59:59.999Z`);

  if (isNaN(startParsed.getTime()) || isNaN(endParsed.getTime())) {
    throw new BadRequestException('Invalid date provided for custom range.');
  }

  if (startParsed.getTime() > endParsed.getTime()) {
    throw new BadRequestException('startDate cannot be after endDate.');
  }

  // Reasonable year boundaries check (between year 2000 and 2100)
  const startYear = startParsed.getUTCFullYear();
  const endYear = endParsed.getUTCFullYear();
  if (startYear < 2000 || endYear > 2100) {
    throw new BadRequestException('Dates must be between the years 2000 and 2100.');
  }

  return {
    range: 'custom',
    startDateTime: startParsed,
    endDateTime: endParsed,
    timezone: tz,
  };
}
