import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeaderboardsService } from './leaderboards.service';
import { LeaderBoard } from '../database/entities/leaderboard.entity';

describe('LeaderboardsService', () => {
  let service: LeaderboardsService;
  let mockQueryBuilder: {
    leftJoinAndSelect: jest.Mock;
    orderBy: jest.Mock;
    where: jest.Mock;
    getMany: jest.Mock;
  };
  let mockRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    };

    mockRepo = {
      create: jest.fn((dto) => ({ id: 10, ...dto })),
      save: jest.fn(async (e) => e),
      find: jest.fn(async () => []),
      findOne: jest.fn(async () => null),
      update: jest.fn(async () => ({ affected: 1 })),
      delete: jest.fn(async () => ({ affected: 1 })),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardsService,
        { provide: getRepositoryToken(LeaderBoard), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<LeaderboardsService>(LeaderboardsService);
  });

  it('create: сохраняет запись результата с дополнительными полями', async () => {
    const payload = {
      userId: 1,
      wpm: 92,
      accuracy: 98,
      duration_sec: 30,
      language: 'ru',
      mode: 'text',
      characters: 230,
      errors: 4,
    };

    const res = await service.create(payload);
    expect(mockRepo.create).toHaveBeenCalledWith(payload);
    expect(res.wpm).toBe(92);
    expect(res.language).toBe('ru');
    expect(res.mode).toBe('text');
  });

  it('findAll: применяет фильтр daily за последние 24 часа', async () => {
    await service.findAll('daily');
    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      'leaderboard.createdAt >= :oneDayAgo',
      expect.objectContaining({ oneDayAgo: expect.any(Date) }),
    );
  });

  it('findByUserId: запрашивает результаты в хронологическом порядке (ASC)', async () => {
    await service.findByUserId(5);
    expect(mockRepo.find).toHaveBeenCalledWith({
      where: { userId: 5 },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  });
});
