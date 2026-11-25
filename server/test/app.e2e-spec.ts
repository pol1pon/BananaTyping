import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

// Изолированная БД в памяти, чтобы E2E-тесты не затрагивали рабочую banana_typing.sqlite
process.env.DB_DATABASE = ':memory:';
process.env.JWT_SECRET = 'e2e_test_jwt_secret';
process.env.ADMIN_SECRET_KEY = 'banana_secret_admin_2026';

import { AppModule } from '../src/app.module';

describe('BananaTyping Full HTTP E2E Suite', () => {
  let app: INestApplication;
  let userId: number;
  let accessToken: string;
  let createdTextId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth & Validation', () => {
    it('POST /auth/register — регистрирует нового пользователя', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'e2e_tester',
          email: 'e2e@banana.test',
          password: 'password123',
        })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.username).toBe('e2e_tester');
      expect(res.body.user.role).toBe('user');
      expect(res.body.user.password).toBeUndefined();

      userId = res.body.user.id;
      accessToken = res.body.accessToken;
    });

    it('POST /auth/register — отклоняет дубликат email (401)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'another',
          email: 'e2e@banana.test',
          password: 'password123',
        })
        .expect(401);
    });

    it('POST /auth/login — успешно авторизует и отклоняет неверный пароль', async () => {
      const okRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@banana.test', password: 'password123' })
        .expect(201);

      expect(okRes.body.accessToken).toBeDefined();
      expect(okRes.body.user.email).toBe('e2e@banana.test');

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@banana.test', password: 'wrongpassword' })
        .expect(401);
    });

    it('ValidationPipe — отклоняет неразрешённые поля в запросе (400)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send({ unknownHackerField: 'hack' })
        .expect(400);

      expect(JSON.stringify(res.body.message)).toContain('should not exist');
    });
  });

  describe('User Profile, Avatar, Bio & Admin Secret Claim', () => {
    it('PUT /users/:id — обновляет username, bio, avatar и password', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send({
          username: 'banana_master',
          bio: 'Печатаю со скоростью 110 WPM',
          avatar: 'banana-angel',
          password: 'newsecurepassword',
        })
        .expect(200);

      expect(res.body.username).toBe('banana_master');
      expect(res.body.bio).toBe('Печатаю со скоростью 110 WPM');
      expect(res.body.avatar).toBe('banana-angel');
      expect(res.body.password).toBeUndefined();

      // Вход с новым паролем должен работать
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@banana.test', password: 'newsecurepassword' })
        .expect(201);
    });

    it('GET /users/:id — возвращает безопасный профиль без password', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(res.body.username).toBe('banana_master');
      expect(res.body.avatar).toBe('banana-angel');
      expect(res.body.password).toBeUndefined();
    });

    it('GET /users/verify-secret — проверяет валидность секретного ключа', async () => {
      const invalidRes = await request(app.getHttpServer())
        .get('/users/verify-secret?key=wrong_key')
        .expect(200);
      expect(invalidRes.body.valid).toBe(false);

      const validRes = await request(app.getHttpServer())
        .get('/users/verify-secret?key=banana_secret_admin_2026')
        .expect(200);
      expect(validRes.body.valid).toBe(true);
    });

    it('POST /users/claim-admin — отклоняет неверный ключ и активирует admin по верному ключу', async () => {
      await request(app.getHttpServer())
        .post('/users/claim-admin')
        .send({ userId, secretKey: 'wrong_secret' })
        .expect(401);

      const res = await request(app.getHttpServer())
        .post('/users/claim-admin')
        .send({ userId, secretKey: 'banana_secret_admin_2026' })
        .expect(201);

      expect(res.body.role).toBe('admin');
      expect(res.body.password).toBeUndefined();
    });

    it('GET /users/admin/stats — возвращает статистику пользователей и админов', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/admin/stats')
        .expect(200);

      expect(res.body.totalUsers).toBeGreaterThanOrEqual(1);
      expect(res.body.totalAdmins).toBeGreaterThanOrEqual(1);
      expect(res.body.adminSecretKey).toBe('banana_secret_admin_2026');
    });
  });

  describe('Leaderboards & Training Progress', () => {
    it('POST /leaderboards — сохраняет заезды с полными и минимальными полями', async () => {
      const r1 = await request(app.getHttpServer())
        .post('/leaderboards')
        .send({
          userId,
          wpm: 72,
          accuracy: 96,
          duration_sec: 20,
          language: 'ru',
          mode: 'quick',
          characters: 120,
          errors: 4,
        })
        .expect(201);

      expect(r1.body.wpm).toBe(72);
      expect(r1.body.language).toBe('ru');
      expect(r1.body.mode).toBe('quick');

      const r2 = await request(app.getHttpServer())
        .post('/leaderboards')
        .send({
          userId,
          wpm: 95,
          accuracy: 99,
          duration_sec: 30,
        })
        .expect(201);

      expect(r2.body.wpm).toBe(95);
    });

    it('GET /leaderboards/user/:userId — возвращает историю пользователя в хронологическом порядке', async () => {
      const res = await request(app.getHttpServer())
        .get(`/leaderboards/user/${userId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].wpm).toBe(72);
      expect(res.body[1].wpm).toBe(95);
    });

    it('GET /leaderboards?period=daily — сортирует по убыванию WPM', async () => {
      const res = await request(app.getHttpServer())
        .get('/leaderboards?period=daily')
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0].wpm).toBeGreaterThanOrEqual(res.body[1].wpm);
    });
  });

  describe('Texts CRUD', () => {
    it('POST /texts -> GET /texts -> PUT /texts/:id -> DELETE /texts/:id', async () => {
      const created = await request(app.getHttpServer())
        .post('/texts')
        .send({
          content: 'Тестовый текст для проверки слепой печати на BananaTyping.',
          language: 'ru',
          topic: 'тестирование',
          difficulty: 'medium',
          source: 'manual',
        })
        .expect(201);

      createdTextId = created.body.id;
      expect(created.body.language).toBe('ru');

      const list = await request(app.getHttpServer()).get('/texts').expect(200);
      expect(list.body.some((t: any) => t.id === createdTextId)).toBe(true);

      const randomText = await request(app.getHttpServer())
        .get('/texts/random?language=ru')
        .expect(200);
      expect(randomText.body.content).toBeTruthy();

      const updated = await request(app.getHttpServer())
        .put(`/texts/${createdTextId}`)
        .send({ topic: 'обновленная тема' })
        .expect(200);
      expect(updated.body.topic).toBe('обновленная тема');

      await request(app.getHttpServer()).delete(`/texts/${createdTextId}`).expect(200);
    });
  });

  describe('Cleanup', () => {
    it('DELETE /users/:id — удаляет пользователя', async () => {
      expect(accessToken).toBeDefined();
      await request(app.getHttpServer()).delete(`/users/${userId}`).expect(200);
      const afterDelete = await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);
      expect(afterDelete.body).toEqual({});
    });
  });
});
