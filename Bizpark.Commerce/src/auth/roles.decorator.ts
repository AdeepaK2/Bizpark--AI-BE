import { SetMetadata } from '@nestjs/common';
import { CommerceUserRole } from '../db/entities';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: CommerceUserRole[]) => SetMetadata(ROLES_KEY, roles);
