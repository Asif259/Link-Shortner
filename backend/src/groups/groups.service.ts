import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity.js';
import { Link } from '../links/entities/link.entity.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';

export interface GroupListItem {
  id: string;
  name: string;
  description: string | null;
  linkCount: number;
  totalClicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupDetailLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  isActive: boolean;
  clickCount: number;
  createdAt: string;
}

export interface GroupDetailResponse {
  id: string;
  name: string;
  description: string | null;
  linkCount: number;
  totalClicks: number;
  createdAt: string;
  updatedAt: string;
  links: GroupDetailLink[];
}

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>,
  ) {}

  async create(userId: string, dto: CreateGroupDto): Promise<Group> {
    const group = this.groupRepository.create({
      userId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
    });
    return this.groupRepository.save(group);
  }

  async findAll(userId: string): Promise<GroupListItem[]> {
    const rawGroups = await this.groupRepository
      .createQueryBuilder('group')
      .leftJoin('group.links', 'link')
      .leftJoin('link.clicks', 'click')
      .select([
        'group.id AS id',
        'group.name AS name',
        'group.description AS description',
        'group.created_at AS "createdAt"',
        'group.updated_at AS "updatedAt"',
      ])
      .addSelect('COUNT(DISTINCT link.id)::int', 'linkCount')
      .addSelect('COUNT(click.id)::int', 'totalClicks')
      .where('group.user_id = :userId', { userId })
      .groupBy('group.id')
      .orderBy('group.created_at', 'DESC')
      .getRawMany();

    return rawGroups.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      linkCount: Number(r.linkCount ?? 0),
      totalClicks: Number(r.totalClicks ?? 0),
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : new Date(r.createdAt).toISOString(),
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : new Date(r.updatedAt).toISOString(),
    }));
  }

  async findOne(id: string, userId: string): Promise<GroupDetailResponse> {
    const group = await this.groupRepository.findOne({
      where: { id, userId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }

    // Load links in this group with their click counts
    const rawLinks = await this.linkRepository
      .createQueryBuilder('link')
      .leftJoin('link.clicks', 'click')
      .select([
        'link.id AS id',
        'link.short_code AS "shortCode"',
        'link.original_url AS "originalUrl"',
        'link.is_active AS "isActive"',
        'link.created_at AS "createdAt"',
      ])
      .addSelect('COUNT(click.id)::int', 'clickCount')
      .where('link.group_id = :groupId', { groupId: id })
      .andWhere('link.user_id = :userId', { userId })
      .groupBy('link.id')
      .orderBy('link.created_at', 'DESC')
      .getRawMany();

    let totalClicks = 0;
    const links: GroupDetailLink[] = rawLinks.map((r) => {
      const clicks = Number(r.clickCount ?? 0);
      totalClicks += clicks;
      return {
        id: r.id,
        shortCode: r.shortCode,
        originalUrl: r.originalUrl,
        isActive: Boolean(r.isActive),
        clickCount: clicks,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : new Date(r.createdAt).toISOString(),
      };
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      linkCount: links.length,
      totalClicks,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      links,
    };
  }

  async update(id: string, userId: string, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id, userId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }

    if (dto.name !== undefined) {
      group.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      group.description = dto.description?.trim() || null;
    }

    return this.groupRepository.save(group);
  }

  async remove(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const group = await this.groupRepository.findOne({
      where: { id, userId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID "${id}" not found`);
    }

    // Nullify group_id for all links in this group to preserve links safely
    await this.linkRepository.update({ groupId: id }, { groupId: null });
    await this.groupRepository.remove(group);

    return { success: true, message: 'Group deleted successfully' };
  }

  async addLink(groupId: string, linkId: string, userId: string): Promise<{ success: boolean; linkId: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, userId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID "${groupId}" not found`);
    }

    const link = await this.linkRepository.findOne({
      where: { id: linkId, userId },
    });

    if (!link) {
      throw new NotFoundException(`Link with ID "${linkId}" not found`);
    }

    link.groupId = groupId;
    await this.linkRepository.save(link);

    return { success: true, linkId };
  }

  async removeLink(groupId: string, linkId: string, userId: string): Promise<{ success: boolean; linkId: string }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, userId },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID "${groupId}" not found`);
    }

    const link = await this.linkRepository.findOne({
      where: { id: linkId, userId },
    });

    if (!link) {
      throw new NotFoundException(`Link with ID "${linkId}" not found`);
    }

    if (link.groupId === groupId) {
      link.groupId = null;
      await this.linkRepository.save(link);
    }

    return { success: true, linkId };
  }
}
