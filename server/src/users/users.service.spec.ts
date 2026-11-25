import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '../database/entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      save: jest.fn(async (entity) => entity),
      find: jest.fn(async () => []),
      findOne: jest.fn(async () => null),
      update: jest.fn(async () => ({ affected: 1 })),
      delete: jest.fn(async () => ({ affected: 1 })),
      count: jest.fn(async () => 0),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'ADMIN_SECRET_KEY') return 'test_secret_2026';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('create: создаёт пользователя с ролью user по умолчанию', async () => {
    const result = await service.create({
      username: 'banana_pro',
      email: 'pro@banana.io',
      password: 'hashed_password',
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      username: 'banana_pro',
      email: 'pro@banana.io',
      password: 'hashed_password',
      role: 'user',
    });
    expect(result.role).toBe('user');
  });

  it('findAll & findOneSafe: удаляют пароль из возвращаемых объектов', async () => {
    const userRow = {
      id: 1,
      username: 'alex',
      email: 'alex@test.com',
      password: 'secret_hash_value',
      role: 'user',
      avatar: 'banana-classic',
      bio: 'bio text',
    } as User;

    mockRepo.find.mockResolvedValue([userRow]);
    mockRepo.findOne.mockResolvedValue(userRow);

    const list = await service.findAll();
    expect(list).toHaveLength(1);
    expect((list[0] as any).password).toBeUndefined();
    expect(list[0].username).toBe('alex');

    const one = await service.findOneSafe(1);
    expect(one).not.toBeNull();
    expect((one as any).password).toBeUndefined();
    expect(one?.bio).toBe('bio text');
  });

  it('update: обновляет профиль, хеширует новый пароль и не утекает password', async () => {
    const existing = {
      id: 7,
      username: 'old_name',
      email: 'old@test.com',
      password: 'old_hash',
      role: 'user',
    } as User;

    const updated = {
      ...existing,
      username: 'new_name',
      bio: 'Люблю слепую печать',
      avatar: 'banana-king',
    } as User;

    mockRepo.findOne
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated);

    const res = await service.update(7, {
      username: '  new_name  ',
      bio: 'Люблю слепую печать',
      avatar: 'banana-king',
      password: 'newpassword123',
    });

    expect(mockRepo.update).toHaveBeenCalledTimes(1);
    const [updateId, updatePayload] = mockRepo.update.mock.calls[0];
    expect(updateId).toBe(7);
    expect(updatePayload.username).toBe('new_name');
    expect(updatePayload.bio).toBe('Люблю слепую печать');
    expect(updatePayload.avatar).toBe('banana-king');
    expect(await bcrypt.compare('newpassword123', updatePayload.password)).toBe(true);
    expect((res as any).password).toBeUndefined();
  });

  it('update: не вызывает repository.update если передан пустой объект', async () => {
    const existing = { id: 1, username: 'u', email: 'u@e.com', password: 'h', role: 'user' } as User;
    mockRepo.findOne.mockResolvedValue(existing);

    await service.update(1, {});
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('update: выбрасывает NotFoundException если пользователь не найден', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    await expect(service.update(999, { username: 'test' })).rejects.toThrow(NotFoundException);
  });

  it('claimAdmin: выдаёт роль admin при верном секретном ключе', async () => {
    const user = { id: 2, username: 'typer', email: 't@t.io', password: 'h', role: 'user' } as User;
    mockRepo.findOne.mockResolvedValue(user);
    mockRepo.save.mockImplementation(async (u) => u);

    const res = await service.claimAdmin(2, '  test_secret_2026  ');
    expect(res.role).toBe('admin');
    expect((res as any).password).toBeUndefined();
  });

  it('claimAdmin: отклоняет неверный секретный ключ с UnauthorizedException', async () => {
    await expect(service.claimAdmin(2, 'wrong_key')).rejects.toThrow(UnauthorizedException);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('verifySecretKey & getAdminStats: проверяют ключ и возвращают статистику', async () => {
    expect(service.verifySecretKey('test_secret_2026')).toBe(true);
    expect(service.verifySecretKey('invalid')).toBe(false);

    mockRepo.count.mockResolvedValueOnce(12).mockResolvedValueOnce(2);
    const stats = await service.getAdminStats();
    expect(stats).toEqual({
      totalUsers: 12,
      totalAdmins: 2,
      adminSecretKey: 'test_secret_2026',
    });
  });
});
