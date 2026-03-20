import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // 🟢 Регистрация
  async register(email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hash,
        role: 'USER',
      },
    });

    const tokens = await this.generateTokens(user);

    // 💾 сохраняем refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refresh_token },
    });

    return tokens;
  }

  // 🔐 Логин
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);

    // 💾 обновляем refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refresh_token },
    });

    return tokens;
  }

  // 🔄 Обновление токенов
  async refresh(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException();
    }

    const tokens = await this.generateTokens(user);

    // 🔁 обновляем refresh token (rotation)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refresh_token },
    });

    return tokens;
  }

  // ⚙ Генерация токенов
  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
    });

    const refresh_token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      access_token,
      refresh_token,
    };
  }
}