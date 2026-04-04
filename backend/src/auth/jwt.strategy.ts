import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret || jwtSecret.trim() === '') {
      throw new Error('JWT_SECRET is not set or is empty');
    }
    super({
      // Custom extraction function that reads JWT from HTTP-only cookie
      // Instead of looking for: Authorization: Bearer <token>
      // We look for: Cookie: accessToken=<token>
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First, try to extract from HTTP-only cookie (preferred for web browsers)
        (request: Request) => {
          const token = request.cookies?.accessToken as string | undefined;
          return token || null;
        },
        // Fallback: extract from Authorization header (for mobile apps, Postman, etc)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: { sub: number; email: string }): {
    userId: number;
    email: string;
  } {
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
