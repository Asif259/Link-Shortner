import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { User } from './entities/user.entity.js';
import { UsersService, SafeUser } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { DeleteAccountDto } from './dto/delete-account.dto.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(
    @CurrentUser() user: Omit<User, 'passwordHash'>,
  ): Promise<SafeUser> {
    const found = await this.usersService.findById(user.id);
    return {
      id: user.id,
      name: found?.name ?? user.name,
      email: found?.email ?? user.email,
    };
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<SafeUser> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('change-password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(userId, dto);
  }

  @Delete('account')
  async deleteAccount(
    @CurrentUser('id') userId: string,
    @Body() dto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    return this.usersService.deleteAccount(userId, dto);
  }

  @Post('delete-account')
  async deleteAccountPost(
    @CurrentUser('id') userId: string,
    @Body() dto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    return this.usersService.deleteAccount(userId, dto);
  }
}
