import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppUserRole } from '../../app-users/entities/app-user.entity';

export const APP_ROLES_KEY = 'app-roles';

@Injectable()
export class AppRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppUserRole[]>(
      APP_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: AppUserRole } }>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied');
    }

    const roleHierarchy: Record<AppUserRole, number> = {
      [AppUserRole.GUEST]: 0,
      [AppUserRole.MEMBER]: 1,
      [AppUserRole.VERIFIED_MEMBER]: 2,
    };

    const userLevel = roleHierarchy[user.role] ?? 0;
    const minRequired = Math.min(
      ...requiredRoles.map((r) => roleHierarchy[r] ?? 0),
    );

    if (userLevel < minRequired) {
      throw new ForbiddenException(
        'You do not have the required membership level',
      );
    }

    return true;
  }
}
