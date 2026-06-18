import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  Get, Query,
  UseGuards,
  Request as ReqDecorator,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { StatsService } from '../stats/stats.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

export interface JwtUser {
  _id: string;
  email: string;
  role: string;
  permissions?: string[];
}

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly statsService: StatsService,
  
  ) {}

  /* ================= REGISTER ================= */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const { user, accessToken, refreshToken } =
      await this.authService.register(registerDto, ip as string, userAgent);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      message: 'Registration successful',
      data: {
        user,
        accessToken: accessToken,
      },
    };
  }

  /* ================= LOGIN ================= */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const { user, accessToken, refreshToken } =
      await this.authService.login(loginDto, ip as string, userAgent);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });




    return {
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken: accessToken,
      },
    };
  }



  /* ================= ME ================= */
 
@Get('me')
@UseGuards(JwtAuthGuard)
async me(
  @ReqDecorator() req: Request,
  @Res({ passthrough: true }) res: Response,
) {
  const user = req.user as JwtUser;
  const refreshToken = (req.cookies as Record<string, string>)?.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token missing');
  }

  const { accessToken, refreshToken: newRefreshToken, user: refreshedUser } =
    await this.authService.refreshAccessToken(refreshToken);

  // 🔥 Update cookie with latest role
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return {
    success: true,
    data: {
      user: refreshedUser,
      accessToken,
    },
  };
}

  /* ================= PASSWORD CHANGE ================= */

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @ReqDecorator() req: any,
    @Body() body: { newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.email,
      body.newPassword,
    );
  }

  /* ================= REFRESH TOKEN ================= */
  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const { accessToken, refreshToken: newRefreshToken, user } =
      await this.authService.refreshAccessToken(refreshToken);

    // 🔥 Update cookie with latest role
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      data: {
        user,
        accessToken: accessToken,
      },
    };
  }


  /* ================= SESSIONS ================= */
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@ReqDecorator() req: any) {
    const user = await this.authService.validateUser(req.user._id);
    if (!user) {
        throw new UnauthorizedException('User not found');
    }
    return {
      success: true,
      data: user.sessions,
    };
  }

  @Post('revoke-session/:id')
  @UseGuards(JwtAuthGuard)
  async revokeSession(@ReqDecorator() req: any, @Body() body: { sessionId: string }) {
    return this.authService.revokeSession(req.user._id, body.sessionId);
  }

  /* ================= STATS ================= */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@ReqDecorator() req: Request) {
    const user = req.user as JwtUser;
    const stats =
      user.role === 'SuperAdmin' || user.role === 'Admin'
        ? await this.statsService.getAdminStats()
        : await this.statsService.getUserStats(user._id);

    return {
      success: true,
      data: stats,
    };
  }

  /* ================= LOGOUT ================= */
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }
}
