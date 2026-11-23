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

  findAll(): Promise<LeaderBoard[]> {
    return this.leaderboardRepository.find({ relations: ['user'] });
  }

  findOne(id: number): Promise<LeaderBoard | null> {
    return this.leaderboardRepository.findOne({ where: { id }, relations: ['user'] });
  }

  findByUserId(userId: number): Promise<LeaderBoard[]> {
    return this.leaderboardRepository.find({ where: { userId }, relations: ['user'] });
  }

  async update(id: number, updateLeaderboardDto: UpdateLeaderboardDto): Promise<LeaderBoard | null> {
    await this.leaderboardRepository.update(id, updateLeaderboardDto);
    return this.leaderboardRepository.findOne({ where: { id }, relations: ['user'] });
  }

  async remove(id: number): Promise<void> {
    await this.leaderboardRepository.delete(id);
  }
}
