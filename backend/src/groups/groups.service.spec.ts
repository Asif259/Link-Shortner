import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { GroupsService } from './groups.service.js';
import { Group } from './entities/group.entity.js';
import { Link } from '../links/entities/link.entity.js';

describe('GroupsService', () => {
  let service: GroupsService;
  let groupRepo: any;
  let linkRepo: any;

  beforeEach(async () => {
    groupRepo = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    linkRepo = {
      findOne: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: getRepositoryToken(Group), useValue: groupRepo },
        { provide: getRepositoryToken(Link), useValue: linkRepo },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  describe('create', () => {
    it('should create and save a group', async () => {
      const mockGroup = {
        id: 'group-1',
        userId: 'user-1',
        name: 'Marketing',
        description: 'Marketing campaign links',
      };

      groupRepo.create.mockReturnValue(mockGroup);
      groupRepo.save.mockResolvedValue(mockGroup);

      const result = await service.create('user-1', {
        name: 'Marketing',
        description: 'Marketing campaign links',
      });

      expect(groupRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'Marketing',
        description: 'Marketing campaign links',
      });
      expect(result).toEqual(mockGroup);
    });
  });

  describe('findAll', () => {
    it('should return aggregated group list for user', async () => {
      const mockQb = {
        leftJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          {
            id: 'g-1',
            name: 'Social',
            description: null,
            linkCount: 3,
            totalClicks: 42,
            createdAt: new Date('2026-10-01T00:00:00Z'),
            updatedAt: new Date('2026-10-01T00:00:00Z'),
          },
        ]),
      };
      groupRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('g-1');
      expect(result[0].linkCount).toBe(3);
      expect(result[0].totalClicks).toBe(42);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if group does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return group with links and total clicks', async () => {
      const mockGroup = {
        id: 'g-1',
        userId: 'user-1',
        name: 'Social',
        description: null,
        createdAt: new Date('2026-10-01T00:00:00Z'),
        updatedAt: new Date('2026-10-01T00:00:00Z'),
      };
      groupRepo.findOne.mockResolvedValue(mockGroup);

      const mockLinkQb = {
        leftJoin: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          {
            id: 'l-1',
            shortCode: 'twtr',
            originalUrl: 'https://x.com',
            isActive: true,
            clickCount: 15,
            createdAt: new Date('2026-10-01T00:00:00Z'),
          },
        ]),
      };
      linkRepo.createQueryBuilder.mockReturnValue(mockLinkQb);

      const result = await service.findOne('g-1', 'user-1');

      expect(result.id).toBe('g-1');
      expect(result.links).toHaveLength(1);
      expect(result.totalClicks).toBe(15);
      expect(result.linkCount).toBe(1);
    });
  });

  describe('addLink and removeLink', () => {
    it('should assign link to group', async () => {
      groupRepo.findOne.mockResolvedValue({ id: 'g-1', userId: 'user-1' });
      linkRepo.findOne.mockResolvedValue({ id: 'l-1', userId: 'user-1', groupId: null });
      linkRepo.save.mockImplementation((link: any) => Promise.resolve(link));

      const res = await service.addLink('g-1', 'l-1', 'user-1');

      expect(res.success).toBe(true);
      expect(linkRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'l-1', groupId: 'g-1' }),
      );
    });

    it('should unassign link from group', async () => {
      groupRepo.findOne.mockResolvedValue({ id: 'g-1', userId: 'user-1' });
      linkRepo.findOne.mockResolvedValue({ id: 'l-1', userId: 'user-1', groupId: 'g-1' });
      linkRepo.save.mockImplementation((link: any) => Promise.resolve(link));

      const res = await service.removeLink('g-1', 'l-1', 'user-1');

      expect(res.success).toBe(true);
      expect(linkRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'l-1', groupId: null }),
      );
    });
  });
});
