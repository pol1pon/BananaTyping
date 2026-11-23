import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateToken(payload: { sub: number; email: string }): Promise<{ accessToken: string; expiresIn: number }> {
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn,
    });
    return {
      accessToken: token,
      expiresIn,
    };
  }
}
