import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type CommerceJwtPayload = {
  sub: string;
  tenantId: string;
  email: string;
  role: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'commerce-secret-change-me',
    });
  }

  // Passport verifies the JWT signature before this runs — payload is trusted.
  // Return payload fields as req.user so every handler has id, role, tenantId.
  validate(payload: CommerceJwtPayload) {
    return { id: payload.sub, tenantId: payload.tenantId, email: payload.email, role: payload.role };
  }
}
