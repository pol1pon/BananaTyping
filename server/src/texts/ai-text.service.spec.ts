import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiTextService } from './ai-text.service';

describe('AiTextService', () => {
  let service: AiTextService;
  let originalFetch: typeof global.fetch;

  beforeEach(async () => {
    originalFetch = global.fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiTextService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AiTextService>(AiTextService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('возвращает предзагруженный ИИ-текст из пула мгновенно без сетевого запроса', async () => {
    const fetchSpy = jest.fn(async () => ({
      ok: true,
      text: async () => 'Свежий сгенерированный текст для мгновенной проверки пула в тренажёре.',
    })) as any;
    global.fetch = fetchSpy;

    // Кладём готовый текст в приватный пул напрямую
    const pool: Map<string, any[]> = (service as any).prefetchPool;
    const key = (service as any).buildCacheKey({
      language: 'ru',
      topic: 'бананы и юмор',
      difficulty: 'medium',
      length: 'medium',
      includeNumbers: false,
      includePunctuation: true,
    });
    pool.set(key, [
      {
        text: 'Банан помогает печатать быстрее и без ошибок каждый день.',
        source: 'ai (gemini)',
        topic: 'бананы и юмор',
        language: 'ru',
      },
    ]);

    const t0 = Date.now();
    const res = await service.generateText({
      language: 'ru',
      topic: 'бананы и юмор',
      difficulty: 'medium',
      length: 'medium',
      includeNumbers: false,
      includePunctuation: true,
    });
    const elapsed = Date.now() - t0;

    expect(res.text).toBe('Банан помогает печатать быстрее и без ошибок каждый день.');
    expect(res.source).toBe('ai (gemini)');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(elapsed).toBeLessThan(20);
  });

  it('быстро переключается на тематический локальный генератор с учётом цифр и пунктуации', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('Network disabled');
    }) as any;

    const res = await service.generateText({
      language: 'ru',
      topic: 'программирование и IT',
      length: 'short',
      includeNumbers: true,
      includePunctuation: false,
    });

    expect(res.source).toBe('ai (local-fallback)');
    expect(res.text.length).toBeGreaterThan(40);
    expect(/\d/.test(res.text)).toBe(true);
    expect(/[.,!?;:—–-]/.test(res.text)).toBe(false);
  });
});
