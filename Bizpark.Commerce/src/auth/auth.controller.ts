import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { TenantId } from '../tenant/tenant.decorator';
import { AuthService } from './auth.service';
import { CommerceLoginDto, CommerceRegisterDto } from './dtos';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('api/commerce/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@TenantId() tenantId: string, @Body() dto: CommerceRegisterDto) {
    return this.authService.register(tenantId, dto.email, dto.password, dto.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@TenantId() tenantId: string, @Body() dto: CommerceLoginDto) {
    return this.authService.login(tenantId, dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: unknown) {
    return {
      success: true,
      data: user,
    };
  }
}
