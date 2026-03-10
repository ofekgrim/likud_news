import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like AppAuthGuard but doesn't reject unauthenticated requests.
 * If a valid JWT is present, req.user is populated.
 * If not, req.user remains undefined and the request proceeds.
 */
@Injectable()
export class OptionalAppAuthGuard extends AuthGuard('jwt-app') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Don't throw — just return null if not authenticated
    return user || null;
  }
}
