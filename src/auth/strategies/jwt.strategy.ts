import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'fallback-secret-change-in-production',
    });
  }

  async validate(payload: any) {
    // Here you would typically fetch the user from the database
    // For now, just return the payload
    if (!payload.id || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { userId: payload.id, email: payload.email };
  }
}
