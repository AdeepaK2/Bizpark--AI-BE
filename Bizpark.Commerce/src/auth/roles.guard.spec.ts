import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function mockContext(user: any): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext({ role: 'CUSTOMER' }))).toBe(true);
  });

  it('allows ADMIN when ADMIN role is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(guard.canActivate(mockContext({ role: 'ADMIN' }))).toBe(true);
  });

  it('allows CUSTOMER when CUSTOMER role is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CUSTOMER']);
    expect(guard.canActivate(mockContext({ role: 'CUSTOMER' }))).toBe(true);
  });

  it('throws ForbiddenException when CUSTOMER tries ADMIN route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(mockContext({ role: 'CUSTOMER' }))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when no user on request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(mockContext(null))).toThrow(ForbiddenException);
  });

  it('allows when multiple roles required and user matches one', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'CUSTOMER']);
    expect(guard.canActivate(mockContext({ role: 'CUSTOMER' }))).toBe(true);
  });
});
