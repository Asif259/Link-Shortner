import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { GroupsService } from './groups.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.groupsService.findAll(userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupsService.remove(id, userId);
  }

  @Post(':id/links/:linkId')
  addLink(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupsService.addLink(groupId, linkId, userId);
  }

  @Delete(':id/links/:linkId')
  removeLink(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupsService.removeLink(groupId, linkId, userId);
  }
}
