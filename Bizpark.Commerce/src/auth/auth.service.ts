import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

type CommerceUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

@Injectable()
export class AuthService {
  private readonly usersByTenant = new Map<string, Map<string, CommerceUser>>();

  constructor(private readonly jwtService: JwtService) {}

  async register(tenantId: string, email: string, password: string, name: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const tenantUsers = this.ensureTenantUsers(tenantId);

    if (tenantUsers.has(normalizedEmail)) {
      throw new BadRequestException('Email already in use for this tenant');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: CommerceUser = {
      id: crypto.randomUUID(),
      tenantId,
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    tenantUsers.set(normalizedEmail, user);

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
      }),
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(tenantId: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.usersByTenant.get(tenantId)?.get(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
      }),
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
      },
    };
  }

  findById(tenantId: string, userId: string): Omit<CommerceUser, 'passwordHash'> | null {
    const tenantUsers = this.usersByTenant.get(tenantId);
    if (!tenantUsers) {
      return null;
    }

    for (const user of tenantUsers.values()) {
      if (user.id === userId) {
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return safeUser;
      }
    }

    return null;
  }

  private ensureTenantUsers(tenantId: string) {
    let users = this.usersByTenant.get(tenantId);
    if (!users) {
      users = new Map<string, CommerceUser>();
      this.usersByTenant.set(tenantId, users);
    }
    return users;
  }
}
