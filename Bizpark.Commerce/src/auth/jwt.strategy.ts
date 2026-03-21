import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

type CommerceJwtPayload = {
  sub: string;
  tenantId: string;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'commerce-secret-change-me',
    });
  }

  validate(payload: CommerceJwtPayload) {
    const user = this.authService.findById(payload.tenantId, payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return user;
  }
}
