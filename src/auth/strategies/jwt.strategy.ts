import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, TokenPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    //  console.log('🔥 JwtStrategy LOADED1');
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    //  console.log('🔥 JwtStrategy LOADED2');
    if (!secret) {
      //  console.log('🔥 JwtStrategy LOADED3');
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }
    //  console.log('🔥 JwtStrategy LOADED4');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // ✅ now guaranteed string
    });

    // console.log('🔥 JwtStrategy LOADED5');
  }

  async validate(payload: TokenPayload) {
    // console.log('🟢 JWT PAYLOA6:', payload);

    const user = await this.authService.validateUser(payload._id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
  }
}
