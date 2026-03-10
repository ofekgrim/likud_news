import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUser } from '../../app-users/entities/app-user.entity';

export interface AppJwtPayload {
  sub: string;
  deviceId: string;
  role: string;
  type: 'app';
}

@Injectable()
export class JwtAppStrategy extends PassportStrategy(Strategy, 'jwt-app') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AppUser)
    private readonly appUserRepository: Repository<AppUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('jwt.secret') ?? 'change-this-secret',
    });
  }

  async validate(payload: AppJwtPayload) {
    if (payload.type !== 'app') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.appUserRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is not authorized');
    }

    return {
      id: user.id,
      deviceId: user.deviceId,
      phone: user.phone,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      membershipStatus: user.membershipStatus,
    };
  }
}
