import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';

describe('UsersService', () => {
  let service: UsersService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      findOne: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('updateProfile', () => {
    it('should throw NotFoundException if user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.updateProfile('u1', { name: 'Alice' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update name and return safe user', async () => {
      const mockUser = { id: 'u1', name: 'Old', email: 'a@example.com' };
      repo.findOne.mockResolvedValue(mockUser);
      repo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.updateProfile('u1', { name: 'New Name' });
      expect(result).toEqual({ id: 'u1', name: 'New Name', email: 'a@example.com' });
    });
  });

  describe('changePassword', () => {
    it('should throw UnauthorizedException if current password does not match', async () => {
      const hash = await bcrypt.hash('CorrectPass123!', 10);
      repo.findOne.mockResolvedValue({ id: 'u1', passwordHash: hash });

      await expect(
        service.changePassword('u1', {
          currentPassword: 'WrongPassword!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if new password equals current password', async () => {
      const hash = await bcrypt.hash('SamePassword123!', 10);
      repo.findOne.mockResolvedValue({ id: 'u1', passwordHash: hash });

      await expect(
        service.changePassword('u1', {
          currentPassword: 'SamePassword123!',
          newPassword: 'SamePassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password hash on success', async () => {
      const hash = await bcrypt.hash('OldPassword123!', 10);
      const user = { id: 'u1', passwordHash: hash };
      repo.findOne.mockResolvedValue(user);
      repo.save.mockImplementation((u: any) => Promise.resolve(u));

      const res = await service.changePassword('u1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });

      expect(res.message).toBe('Password changed successfully');
      expect(await bcrypt.compare('NewPassword123!', user.passwordHash)).toBe(true);
    });
  });

  describe('deleteAccount', () => {
    it('should throw UnauthorizedException if confirmation password is wrong', async () => {
      const hash = await bcrypt.hash('Secret123!', 10);
      repo.findOne.mockResolvedValue({ id: 'u1', passwordHash: hash });

      await expect(
        service.deleteAccount('u1', { password: 'Wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should remove user when password is correct', async () => {
      const hash = await bcrypt.hash('Secret123!', 10);
      const user = { id: 'u1', passwordHash: hash };
      repo.findOne.mockResolvedValue(user);
      repo.remove.mockResolvedValue(user);

      const res = await service.deleteAccount('u1', { password: 'Secret123!' });
      expect(res.message).toBe('Account deleted successfully');
      expect(repo.remove).toHaveBeenCalledWith(user);
    });
  });
});
