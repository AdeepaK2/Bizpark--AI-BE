import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { TenantId } from '../tenant/tenant.decorator';
import { AuthService } from './auth.service';
import { CommerceAdminRegisterDto, CommerceLoginDto, CommerceRegisterDto, UpdateProfileDto } from './dtos';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { CurrentUser } from './current-user.decorator';

type JwtUser = { id: string; tenantId: string; email: string; role: string };

@Controller('api/commerce/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Bootstrap — creates the first ADMIN for a tenant; 409 if admin already exists
  @Post('bootstrap')
  bootstrap(@TenantId() tenantId: string, @Body() dto: CommerceAdminRegisterDto) {
    return this.authService.bootstrapAdmin(tenantId, dto.email, dto.password, dto.name);
  }

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

  // Protected — update own profile (name and/or password)
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@TenantId() tenantId: string, @CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return { success: true, data: await this.authService.updateProfile(tenantId, user.id, dto) };
  }

  // Logout — client-side token discard (stateless JWT, no server blacklist)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout() {
    return { success: true, message: 'Logged out. Please discard your token.' };
  }
}
