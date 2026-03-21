import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';
import { CommerceUserEntity } from '../db/entities';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tenantDb: TenantDataSourceFactory,
  ) {}

  async register(tenantId: string, email: string, password: string, name: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const repo = await this.repo(tenantId);

    const existing = await repo.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new BadRequestException('Email already in use for this tenant');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = repo.create({ email: normalizedEmail, passwordHash, name: name.trim() });
    const saved = await repo.save(user);

    return {
      access_token: this.jwtService.sign({ sub: saved.id, tenantId, email: saved.email }),
      user: { id: saved.id, tenantId, email: saved.email, name: saved.name },
    };
  }

  async login(tenantId: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const repo = await this.repo(tenantId);

    const user = await repo.findOne({ where: { email: normalizedEmail } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return {
      access_token: this.jwtService.sign({ sub: user.id, tenantId, email: user.email }),
      user: { id: user.id, tenantId, email: user.email, name: user.name },
    };
  }

  async findById(tenantId: string, userId: string) {
    const repo = await this.repo(tenantId);
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) return null;
    const { passwordHash: _ph, ...safeUser } = user;
    return { ...safeUser, tenantId };
  }

  private async repo(tenantId: string) {
    const ds = await this.tenantDb.getDataSource(tenantId);
    return ds.getRepository(CommerceUserEntity);
  }
}
