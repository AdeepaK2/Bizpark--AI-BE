import { Body, Controller, Get, Param, Post, Redirect, Render, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import type { AdminRequest } from '../common/admin-request';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(AdminAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Render('users/index')
  async index(@Req() request: AdminRequest) {
    return {
      title: 'Users',
      admin: request.adminUser,
      users: await this.usersService.list(),
    };
  }

  @Get(':id')
  @Render('users/detail')
  async detail(@Param('id') id: string, @Req() request: AdminRequest) {
    return {
      title: 'User Detail',
      admin: request.adminUser,
      user: await this.usersService.detail(id),
    };
  }

  @Post(':id/status')
  @Redirect()
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: string,
    @Req() request: AdminRequest,
  ) {
    await this.usersService.updateStatus(id, isActive === 'true', request.adminUser?.id);
    return { url: `/admin/users/${id}` };
  }
}
