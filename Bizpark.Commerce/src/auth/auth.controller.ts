import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { TenantId } from '../tenant/tenant.decorator';
import { AuthService } from './auth.service';
import { CommerceAdminRegisterDto, CommerceLoginDto, CommerceRegisterDto } from './dtos';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { CurrentUser } from './current-user.decorator';

@Controller('api/commerce/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Public — register as CUSTOMER
  @Post('register')
  register(@TenantId() tenantId: string, @Body() dto: CommerceRegisterDto) {
    return this.authService.register(tenantId, dto.email, dto.password, dto.name, 'CUSTOMER');
  }

  // Protected — only existing ADMIN can create another ADMIN
  @Post('admin/register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  registerAdmin(@TenantId() tenantId: string, @Body() dto: CommerceAdminRegisterDto) {
    return this.authService.register(tenantId, dto.email, dto.password, dto.name, 'ADMIN');
  }

  // Public — login for both CUSTOMER and ADMIN
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@TenantId() tenantId: string, @Body() dto: CommerceLoginDto) {
    return this.authService.login(tenantId, dto.email, dto.password);
  }

  // Protected — get current user profile
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: unknown) {
    return { success: true, data: user };
  }
}
