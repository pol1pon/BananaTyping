import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../database/entities/user.entity';
import { LeaderBoard } from '../database/entities/leaderboard.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      ...createUserDto,
      role: 'user',
    });
    return this.userRepository.save(user);
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map((u) => this.stripPassword(u));
  }

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findOneSafe(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;
    return this.stripPassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    const updateData: Partial<User> = {};

    if (updateUserDto.username !== undefined) {
      updateData.username = updateUserDto.username.trim();
    }
    if (updateUserDto.email !== undefined) {
      updateData.email = updateUserDto.email.trim();
    }
    if (updateUserDto.avatar !== undefined) {
      updateData.avatar = updateUserDto.avatar;
    }
    if (updateUserDto.bio !== undefined) {
      updateData.bio = updateUserDto.bio;
    }
    if (updateUserDto.role !== undefined) {
      updateData.role = updateUserDto.role;
    }
    if (updateUserDto.isPrivate !== undefined) {
      updateData.isPrivate = Boolean(updateUserDto.isPrivate);
    }
    if (updateUserDto.password && updateUserDto.password.trim() !== '') {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(id, updateData);
    }
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    return this.stripPassword(updatedUser!);
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }
    if (this.userRepository.manager) {
      await this.userRepository.manager.delete(LeaderBoard, { userId: id });
    }
    await this.userRepository.delete(id);
  }

  /**
   * Активация прав администратора по секретному ключу / ссылке
   */
  async claimAdmin(userId: number, secretKey: string): Promise<Omit<User, 'password'>> {
    const adminSecret = this.configService.get<string>('ADMIN_SECRET_KEY') || 'banana_secret_admin_2026';

    if (!secretKey || secretKey.trim() !== adminSecret.trim()) {
      throw new UnauthorizedException('Неверный секретный ключ администратора');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    user.role = 'admin';
    const saved = await this.userRepository.save(user);
    return this.stripPassword(saved);
  }

  /**
   * Проверка секретного ключа администратора
   */
  verifySecretKey(secretKey: string): boolean {
    const adminSecret = this.configService.get<string>('ADMIN_SECRET_KEY') || 'banana_secret_admin_2026';
    return Boolean(secretKey && secretKey.trim() === adminSecret.trim());
  }

  /**
   * Статистика для админ-панели
   */
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalAdmins: number;
    adminSecretKey: string;
  }> {
    const totalUsers = await this.userRepository.count();
    const totalAdmins = await this.userRepository.count({ where: { role: 'admin' } });
    const adminSecretKey = this.configService.get<string>('ADMIN_SECRET_KEY') || 'banana_secret_admin_2026';

    return {
      totalUsers,
      totalAdmins,
      adminSecretKey,
    };
  }

  async findPublicProfile(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    const isPrivate = Boolean(user.isPrivate);
    const results =
      !isPrivate && this.userRepository.manager
        ? await this.userRepository.manager.find(LeaderBoard, {
            where: { userId: id },
            order: { createdAt: 'ASC', id: 'ASC' },
          })
        : [];

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      role: user.role || 'user',
      isPrivate,
      createdAt: user.createdAt,
      bio: isPrivate ? null : user.bio || null,
      results,
    };
  }

  private stripPassword(user: User): Omit<User, 'password'> {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
