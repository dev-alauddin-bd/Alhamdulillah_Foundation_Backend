import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UAParser } from 'ua-parser-js';
import { v4 as uuidv4 } from 'uuid';


import { User, UserRole } from '../user/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  Payment,
  PaymentPurpose,
  PaymentStatus,
} from 'src/payment/schemas/payment.schema';

/* ================= TOKEN PAYLOAD ================= */
export interface TokenPayload {
  _id: string;
  email: string;
  role: UserRole;
  permissions: string[];
}


@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}


  /* ================= TOKEN HELPERS ================= */

  private generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES') || '15m',
    });
  }

  private generateRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES') || '7d',
    });
  }

  private generateTokens(payload: TokenPayload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  private verifyRefreshToken(token: string): TokenPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  /* ================= REGISTER ================= */

  async register(registerDto: RegisterDto, ip?: string, userAgent?: string) {
    const { email, password, name, phone, address, avatar } = registerDto;

    // 1️⃣ Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // 2️⃣ Create User
    const user = new this.userModel({
      name,
      email,
      password,
      phone: phone || '',
      address: address || '',
      avatar: avatar || '',
      role: UserRole.USER,
      permissions: [],
    });

    await user.save();

    // 3️⃣ Record Session
    if (ip && userAgent) {
      await this.recordSession(user._id.toString(), ip, userAgent);
    }

    const payload: TokenPayload = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    const tokens = this.generateTokens(payload);

    return {
      user,
      ...tokens,
    };
  }

  /* ================= LOGIN ================= */

  async login(loginDto: LoginDto, ip?: string, userAgent?: string) {
    console.log('🔐 Login request received', loginDto);

    const { email, password } = loginDto;
    // console.log('📧 Email:', email);
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    // 1️⃣ Find user
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) {
      // console.log('❌ Login failed: User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2️⃣ Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // console.log('❌ Login failed: Wrong password');
      throw new UnauthorizedException('Invalid credentials');
    }

    // console.log('✅ Password matched');

    // 3️⃣ Record Session
    if (ip && userAgent) {
        await this.recordSession(user._id.toString(), ip, userAgent);
    }

    user.lastLogin = new Date();
    await user.save();

    console.log('🕒 Last login updated');

    // 4️⃣ JWT Payload
    const payload: TokenPayload = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    // console.log('🧾 JWT payload created');

    // 5️⃣ Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(payload);

    // console.log('🔑 Tokens generated successfully');

    // 6️⃣ Final success log
    // console.log(`🎉 Login success for user: ${user.email}`);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async me(userId: string) {
    // 1️⃣ User
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    console.log(user);

    // 2️⃣ Check activation payment
    const activationPayment = await this.paymentModel.findOne({
      userId,
      // purpose: PaymentPurpose.ACCOUNT_ACTIVATION,
      status: PaymentStatus.PAID,
    });

    const isActivated = !!activationPayment;
    console.log({
      ...user,
      isActivated: isActivated,
    });
    return {
      ...user,
      isActivated: isActivated,
    };
  }

  /* ================= REFRESH TOKEN ================= */

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.verifyRefreshToken(refreshToken);

      const user = await this.userModel.findById(payload._id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = this.generateTokens({
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      });

      return {
        user,
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /* ================= VALIDATE USER ================= */

  async validateUser(userId: string) {
    return this.userModel.findById(userId);
  }

  /* ================= PASSWORD CHANGE ================= */

  async changePassword(email: string, newPassword: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
        throw new NotFoundException('User not found');
    }

    user.password = newPassword;
    await user.save();

    return { success: true, message: 'Password updated successfully' };
  }

  /* ================= SESSION RECORDING ================= */

  private async recordSession(userId: string, ip: string, userAgent: string) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const deviceName = result.device.model 
        ? `${result.device.vendor || ''} ${result.device.model}`.trim() 
        : result.os.name || 'Unknown Device';
    
    const session = {
        sessionId: uuidv4(),
        device: deviceName,
        browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
        os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
        ip: ip,
        loginAt: new Date(),
    };

    await this.userModel.findByIdAndUpdate(userId, {
        $push: { sessions: { $each: [session], $slice: -10 } } // Keep last 10 sessions
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
        $pull: { sessions: { sessionId } }
    });
    return { success: true, message: 'Session revoked successfully' };
  }
}
