import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: { generateToken: jest.Mock };
  let mockUsersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    mockAuthService = {
      generateToken: jest.fn(async () => ({ accessToken: 'jwt.token.value', expiresIn: 86400 })),
    };

    mockUsersService = {
      findByEmail: jest.fn(async () => null),
      create: jest.fn(async (dto) => ({
        id: 1,
        ...dto,
        avatar: undefined,
        bio: undefined,
        role: 'user',
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('register: регистрирует нового пользователя, хеширует пароль и возвращает токен', async () => {
    const res = await controller.register({
      username: 'newuser',
      email: 'new@banana.io',
      password: 'password123',
    });

    expect(res.accessToken).toBe('jwt.token.value');
    expect(res.user).toEqual({
      id: 1,
      username: 'newuser',
      email: 'new@banana.io',
      avatar: undefined,
      bio: undefined,
      role: 'user',
      isPrivate: false,
    });

    const createArg = mockUsersService.create.mock.calls[0][0];
    expect(createArg.password).not.toBe('password123');
    expect(await bcrypt.compare('password123', createArg.password)).toBe(true);
  });

  it('register: отклоняет дублирующийся email', async () => {
    mockUsersService.findByEmail.mockResolvedValue({ id: 5, email: 'dup@banana.io' });

    await expect(
      controller.register({ username: 'u', email: 'dup@banana.io', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login: успешно авторизует при верном пароле и возвращает профиль', async () => {
    const hash = await bcrypt.hash('password123', 10);
    mockUsersService.findByEmail.mockResolvedValue({
      id: 3,
      username: 'pro_typer',
      email: 'pro@banana.io',
      password: hash,
      avatar: 'banana-angel',
      bio: '120 WPM',
      role: 'admin',
    });

    const res = await controller.login({
      email: 'pro@banana.io',
      password: 'password123',
    });

    expect(res.accessToken).toBe('jwt.token.value');
    expect(res.user).toEqual({
      id: 3,
      username: 'pro_typer',
      email: 'pro@banana.io',
      avatar: 'banana-angel',
      bio: '120 WPM',
      role: 'admin',
      isPrivate: false,
    });
  });

  it('login: отклоняет неверный пароль', async () => {
    const hash = await bcrypt.hash('correct123', 10);
    mockUsersService.findByEmail.mockResolvedValue({
      id: 3,
      email: 'pro@banana.io',
      password: hash,
    });

    await expect(
      controller.login({ email: 'pro@banana.io', password: 'wrongpassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
