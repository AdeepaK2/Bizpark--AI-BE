import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { applicationDb, JwtPayload } from 'bizpark.core';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'super-secret-key-change-me',
        });
    }

    async validate(payload: JwtPayload) {
        const user = await applicationDb.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
            throw new UnauthorizedException();
        }
        // Return safe user object to append to `request.user`
        return { id: user.id, email: user.email, name: user.name };
    }
}
