import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity.js';
import { Link } from '../links/entities/link.entity.js';
import { GroupsService } from './groups.service.js';
import { GroupsController } from './groups.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Link])],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
