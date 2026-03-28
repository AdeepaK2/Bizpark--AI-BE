import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { TenantDataSourceFactory } from '../db/tenant-datasource.factory';

function makeMockRepo(existingUser: any = null) {
  return {
    findOne: jest.fn().mockResolvedValue(existingUser),
    create: jest.fn((data) => ({ ...data, id: 'uid-1' })),
    save: jest.fn((data) => Promise.resolve({ ...data, id: 'uid-1' })),
  };
}

function makeFactory(repo: any): TenantDataSourceFactory {
  return {
    getDataSource: jest.fn().mockResolvedValue({
      getRepository: jest.fn().mockReturnValue(repo),
    }),
  } as unknown as TenantDataSourceFactory;
}

describe('AuthService', () => {
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = { sign: jest.fn().mockReturnValue('mock-jwt-token') } as unknown as JwtService;
  });

  describe('register', () => {
    it('creates a new CUSTOMER and returns token', async () => {
      const repo = makeMockRepo(null);
      const service = new AuthService(jwtService, makeFactory(repo));

      const result = await service.register('tenant1', 'user@test.com', 'pass123', 'User');

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('user@test.com');
      expect(repo.save).toHaveBeenCalled();
    });

    it('creates ADMIN when role is ADMIN', async () => {
      const adminUser = { id: 'uid-2', email: 'admin@test.com', passwordHash: 'hashed', name: 'Admin', role: 'ADMIN' };
      const repo = { findOne: jest.fn().mockResolvedValue(null), create: jest.fn((d) => d), save: jest.fn().mockResolvedValue(adminUser) };
      const service = new AuthService(jwtService, makeFactory(repo));

      const result = await service.register('tenant1', 'admin@test.com', 'pass', 'Admin', 'ADMIN');
      expect(result.user.role).toBe('ADMIN');
    });

    it('throws BadRequestException if email already exists', async () => {
      const existing = { id: 'uid-1', email: 'exists@test.com', passwordHash: 'h', name: 'X', role: 'CUSTOMER' };
      const repo = makeMockRepo(existing);
      const service = new AuthService(jwtService, makeFactory(repo));

      await expect(service.register('tenant1', 'exists@test.com', 'pass', 'X')).rejects.toThrow(BadRequestException);
    });

    it('normalizes email to lowercase', async () => {
      const repo = makeMockRepo(null);
      const service = new AuthService(jwtService, makeFactory(repo));

      await service.register('tenant1', 'USER@TEST.COM', 'pass', 'User');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'user@test.com' } });
    });

    it('hashes the password before saving', async () => {
      const repo = makeMockRepo(null);
      const service = new AuthService(jwtService, makeFactory(repo));

      await service.register('tenant1', 'user@test.com', 'plainpass', 'User');
      const created = repo.create.mock.calls[0][0];
      expect(created.passwordHash).not.toBe('plainpass');
      const isHashed = await bcrypt.compare('plainpass', created.passwordHash);
      expect(isHashed).toBe(true);
    });
  });

  describe('login', () => {
    it('returns token on valid credentials', async () => {
      const hash = await bcrypt.hash('pass123', 10);
      const user = { id: 'uid-1', email: 'user@test.com', passwordHash: hash, name: 'User', role: 'CUSTOMER' };
      const repo = makeMockRepo(user);
      const service = new AuthService(jwtService, makeFactory(repo));

      const result = await service.login('tenant1', 'user@test.com', 'pass123');
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.role).toBe('CUSTOMER');
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correctpass', 10);
      const user = { id: 'uid-1', email: 'user@test.com', passwordHash: hash, name: 'User', role: 'CUSTOMER' };
      const repo = makeMockRepo(user);
      const service = new AuthService(jwtService, makeFactory(repo));

      await expect(service.login('tenant1', 'user@test.com', 'wrongpass')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for unknown email', async () => {
      const repo = makeMockRepo(null);
      const service = new AuthService(jwtService, makeFactory(repo));

      await expect(service.login('tenant1', 'nobody@test.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findById', () => {
    it('returns user without passwordHash', async () => {
      const user = { id: 'uid-1', email: 'u@t.com', passwordHash: 'secret', name: 'U', role: 'CUSTOMER' };
      const repo = makeMockRepo(user);
      const service = new AuthService(jwtService, makeFactory(repo));

      const result = await service.findById('tenant1', 'uid-1');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result!.email).toBe('u@t.com');
    });

    it('returns null when user not found', async () => {
      const repo = makeMockRepo(null);
      const service = new AuthService(jwtService, makeFactory(repo));

      const result = await service.findById('tenant1', 'no-id');
      expect(result).toBeNull();
    });
  });
});
