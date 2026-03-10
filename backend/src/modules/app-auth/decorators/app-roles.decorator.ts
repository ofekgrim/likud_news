import { SetMetadata } from '@nestjs/common';
import { AppUserRole } from '../../app-users/entities/app-user.entity';
import { APP_ROLES_KEY } from '../guards/app-roles.guard';

export const AppRoles = (...roles: AppUserRole[]) =>
  SetMetadata(APP_ROLES_KEY, roles);
