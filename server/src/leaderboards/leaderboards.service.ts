import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderBoard } from '../database/entities/leaderboard.entity';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { UpdateLeaderboardDto } from './dto/update-leaderboard.dto';

@Injectable()
export class LeaderboardsService {
  constructor(
    @InjectRepository(LeaderBoard)
    private readonly leaderboardRepository: Repository<LeaderBoard>,
  ) {}

  create(createLeaderboardDto: CreateLeaderboardDto): Promise<LeaderBoard> {
    const leaderboard = this.leaderboardRepository.create(createLeaderboardDto);
    return this.leaderboardRepository.save(leaderboard);
  }

  async findAll(period?: string): Promise<LeaderBoard[]> {
    const query = this.leaderboardRepository.createQueryBuilder('leaderboard')
      .leftJoinAndSelect('leaderboard.user', 'user')
      .orderBy('leaderboard.wpm', 'DESC');

    if (period === 'daily') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      query.where('leaderboard.createdAt >= :oneDayAgo', { oneDayAgo });
    }

    const entries = await query.getMany();
    return entries.map((entry) => {
      if (entry.user) {
        entry.user = {
          id: entry.user.id,
          username: entry.user.username,
          avatar: entry.user.avatar,
          role: entry.user.role,
          isPrivate: Boolean(entry.user.isPrivate),
        } as any;
      }
      return entry;
    });
  }

  findOne(id: number): Promise<LeaderBoard | null> {
    return this.leaderboardRepository.findOne({ where: { id }, relations: ['user'] });
  }

  findByUserId(userId: number): Promise<LeaderBoard[]> {
    return this.leaderboardRepository.find({
      where: { userId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async update(id: number, updateLeaderboardDto: UpdateLeaderboardDto): Promise<LeaderBoard | null> {
    await this.leaderboardRepository.update(id, updateLeaderboardDto);
    return this.leaderboardRepository.findOne({ where: { id }, relations: ['user'] });
  }

  async remove(id: number): Promise<void> {
    await this.leaderboardRepository.delete(id);
  }
}
