import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from './entities/link.entity.js';
import { LinksController } from './links.controller.js';
import { LinksService } from './links.service.js';
import { RedirectController } from './redirect.controller.js';
import { AnalyticsModule } from '../analytics/analytics.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Link]),
    AnalyticsModule, // provides AnalyticsService to RedirectController
  ],
  controllers: [LinksController, RedirectController],
  providers: [LinksService],
  exports: [LinksService, TypeOrmModule],
})
export class LinksModule {}
