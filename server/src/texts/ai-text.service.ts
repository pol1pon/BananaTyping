import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateTextDto } from './dto/generate-text.dto';

export interface GeneratedResult {
  text: string;
  source: string;
  topic: string;
  language: string;
}

@Injectable()
export class AiTextService {
  private readonly logger = new Logger(AiTextService.name);

  // Серверный пул предсгенерированных ИИ-текстов для мгновенной отдачи (< 1мс)
  private readonly prefetchPool = new Map<string, GeneratedResult[]>();
  private readonly inflightWarmups = new Set<string>();
  private static readonly MAX_POOL_SIZE_PER_KEY = 2;

  constructor(private readonly configService: ConfigService) {}

  private buildCacheKey(options: Required<Pick<GenerateTextDto, 'language' | 'topic' | 'difficulty' | 'length' | 'includeNumbers' | 'includePunctuation'>>): string {
    return `${options.language}|${options.topic.trim().toLowerCase()}|${options.difficulty}|${options.length}|${options.includeNumbers}|${options.includePunctuation}`;
  }

  /**
   * Мгновенная выдача текста из предзагруженного пула или быстрая генерация через ИИ
   */
  async generateText(options: GenerateTextDto = {}): Promise<GeneratedResult> {
    const normalized = {
      language: (options.language || 'ru') as 'ru' | 'en',
      topic: options.topic || (options.language === 'en' ? 'random' : 'случайная тема'),
      difficulty: (options.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
      length: (options.length || 'medium') as 'short' | 'medium' | 'long',
      includeNumbers: options.includeNumbers ?? false,
      includePunctuation: options.includePunctuation ?? true,
    };

    const key = this.buildCacheKey(normalized);
    const pooled = this.prefetchPool.get(key);

    if (pooled && pooled.length > 0) {
      const ready = pooled.shift()!;
      this.logger.debug(`Мгновенная выдача текста из пула (ключ: ${key}, осталось: ${pooled.length})`);
      // Фоново пополняем пул для следующего запроса
      this.warmPoolInBackground(key, normalized);
      return ready;
    }

    const result = await this.generateFresh(normalized);

    // После первой генерации сразу прогреваем запасной текст в фоне
    this.warmPoolInBackground(key, normalized);

    return result;
  }

  /**
   * Фоновое пополнение пула (не блокирует ответ клиенту и не запускается в test-окружении)
   */
  private warmPoolInBackground(
    key: string,
    normalized: {
      language: 'ru' | 'en';
      topic: string;
      difficulty: 'easy' | 'medium' | 'hard';
      length: 'short' | 'medium' | 'long';
      includeNumbers: boolean;
      includePunctuation: boolean;
    },
  ): void {
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
      return;
    }

    const existing = this.prefetchPool.get(key) || [];
    if (existing.length >= AiTextService.MAX_POOL_SIZE_PER_KEY || this.inflightWarmups.has(key)) {
      return;
    }

    this.inflightWarmups.add(key);
    this.generateFresh(normalized)
      .then((res) => {
        // Кладём в пул только живые ИИ-результаты (локальный фолбэк и так мгновенный)
        if (!res.source.includes('local-fallback')) {
          const list = this.prefetchPool.get(key) || [];
          if (list.length < AiTextService.MAX_POOL_SIZE_PER_KEY) {
            list.push(res);
            this.prefetchPool.set(key, list);
          }
        }
      })
      .catch(() => {
        // Фоновый прогрев не должен ронять процесс
      })
      .finally(() => {
        this.inflightWarmups.delete(key);
      });
  }

  /**
   * Непосредственная генерация с жёсткими короткими таймаутами и выбором самого быстрого провайдера
   */
  private async generateFresh(normalized: {
    language: 'ru' | 'en';
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    length: 'short' | 'medium' | 'long';
    includeNumbers: boolean;
    includePunctuation: boolean;
  }): Promise<GeneratedResult> {
    const { language, topic, difficulty, length, includeNumbers, includePunctuation } = normalized;

    // 1. Groq (самый быстрый LLM-инференс ~200–400мс), если задан GROQ_API_KEY
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (groqKey) {
      try {
        const textFromGroq = await this.callGroqAi(
          groqKey,
          language,
          topic,
          difficulty,
          length,
          includeNumbers,
          includePunctuation,
        );
        if (textFromGroq && textFromGroq.length > 20) {
          return {
            text: this.cleanGeneratedText(textFromGroq, includeNumbers, includePunctuation),
            source: 'ai (groq)',
            topic,
            language,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Groq API error: ${err?.message || err}`);
      }
    }

    // 2. Google Gemini (быстрый flash-lite с отключённым thinkingBudget для минимальной задержки)
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      try {
        const textFromGemini = await this.callGeminiAi(
          geminiKey,
          language,
          topic,
          difficulty,
          length,
          includeNumbers,
          includePunctuation,
        );
        if (textFromGemini && textFromGemini.length > 20) {
          return {
            text: this.cleanGeneratedText(textFromGemini, includeNumbers, includePunctuation),
            source: 'ai (gemini)',
            topic,
            language,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Gemini API error: ${err?.message || err}. Переключаемся на резервный провайдер.`);
      }
    }

    // 3. Резервный провайдер Pollinations.ai (быстрая модель openai-fast + таймаут 3.2с)
    try {
      const textFromPollinations = await this.callPollinationsAi(
        language,
        topic,
        difficulty,
        length,
        includeNumbers,
        includePunctuation,
      );
      if (textFromPollinations && textFromPollinations.length > 20) {
        return {
          text: this.cleanGeneratedText(textFromPollinations, includeNumbers, includePunctuation),
          source: 'ai (pollinations)',
          topic,
          language,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Pollinations AI timeout/error: ${err?.message || err}.`);
    }

    // 4. Мгновенный тематический локальный генератор
    this.logger.log('Используется быстрый локальный генератор текстов');
    const localText = this.generateLocalFallbackText(
      language,
      topic,
      length,
      includeNumbers,
      includePunctuation,
    );
    return {
      text: localText,
      source: 'ai (local-fallback)',
      topic,
      language,
    };
  }

  private getLengthGuide(length: string, language: string): string {
    if (language === 'ru') {
      switch (length) {
        case 'short':
          return '150–200 символов';
        case 'long':
          return '290–390 символов';
        case 'medium':
        default:
          return '200–285 символов';
      }
    }
    switch (length) {
      case 'short':
        return '150-200 chars';
      case 'long':
        return '290-390 chars';
      case 'medium':
      default:
        return '200-285 chars';
    }
  }

  private buildCompactPrompt(
    language: string,
    topic: string,
    difficulty: string,
    length: string,
    includeNumbers: boolean,
    includePunctuation: boolean,
  ): string {
    const len = this.getLengthGuide(length, language);
    if (language === 'ru') {
      const numRule = includeNumbers ? 'Включи 2-3 числа.' : 'Без цифр.';
      const punctRule = includePunctuation ? 'Обычная пунктуация.' : 'БЕЗ знаков препинания.';
      return `Напиши связный текст на русском для тренажёра печати. Тема: "${topic}". Длина: ${len}. Сложность: ${difficulty}. ${numRule} ${punctRule} Верни ТОЛЬКО готовый текст без кавычек и пояснений.`;
    }
    const numRule = includeNumbers ? 'Include 2-3 numbers.' : 'No digits.';
    const punctRule = includePunctuation ? 'Standard punctuation.' : 'NO punctuation marks.';
    return `Write a coherent English typing test paragraph. Topic: "${topic}". Length: ${len}. Difficulty: ${difficulty}. ${numRule} ${punctRule} Output ONLY raw text without quotes.`;
  }

  /**
   * Провайдер Groq (если задан GROQ_API_KEY)
   */
  private async callGroqAi(
    apiKey: string,
    language: string,
    topic: string,
    difficulty: string,
    length: string,
    includeNumbers: boolean,
    includePunctuation: boolean,
  ): Promise<string> {
    const prompt = this.buildCompactPrompt(language, topic, difficulty, length, includeNumbers, includePunctuation);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 220,
          temperature: 0.9,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: any = await res.json();
      return (data?.choices?.[0]?.message?.content || '').trim();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Google Gemini: параллельная гонка быстрых моделей Flash-Lite без траты времени на thinking-токены
   */
  private async callGeminiAi(
    apiKey: string,
    language: string,
    topic: string,
    difficulty: string,
    length: string,
    includeNumbers: boolean,
    includePunctuation: boolean,
  ): Promise<string> {
    const cleanKey = apiKey.trim();
    const promptText = this.buildCompactPrompt(language, topic, difficulty, length, includeNumbers, includePunctuation);

    const requestModel = async (model: string, disableThinking: boolean): Promise<string> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3200);

      try {
        const generationConfig: Record<string, any> = {
          maxOutputTokens: 220,
          temperature: 0.9,
        };
        if (disableThinking) {
          generationConfig.thinkingConfig = { thinkingBudget: 0 };
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig,
            }),
            signal: controller.signal,
          },
        );

        if (!res.ok) {
          throw new Error(`Gemini (${model}) HTTP ${res.status}`);
        }

        const data: any = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text || text.trim().length <= 15) {
          throw new Error(`Gemini (${model}) empty response`);
        }
        return text.trim();
      } finally {
        clearTimeout(timeout);
      }
    };

    // Гонка: берём первый успешный ответ среди самых быстрых Flash-Lite моделей
    return Promise.any([
      requestModel('gemini-2.5-flash-lite', true),
      requestModel('gemini-flash-lite-latest', false),
    ]);
  }

  /**
   * Pollinations.ai с быстрой моделью openai-fast и жёстким таймаутом 3.2с
   */
  private async callPollinationsAi(
    language: string,
    topic: string,
    difficulty: string,
    length: string,
    includeNumbers: boolean,
    includePunctuation: boolean,
  ): Promise<string> {
    const prompt = this.buildCompactPrompt(language, topic, difficulty, length, includeNumbers, includePunctuation);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3200);

    try {
      const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai-fast&seed=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/plain',
          'User-Agent': 'BananaTyping/1.0',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  private cleanGeneratedText(
    raw: string,
    includeNumbers: boolean = false,
    includePunctuation: boolean = true,
  ): string {
    let clean = raw.trim();

    if (clean.startsWith('```') && clean.endsWith('```')) {
      clean = clean.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
    }

    clean = clean.replace(/^(Вот текст для (тренировки|набора|слепой печати|тебя):?\s*)/i, '');
    clean = clean.replace(/^(Here is a (text|paragraph|typing practice):?\s*)/i, '');

    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith('«') && clean.endsWith('»'))) {
      clean = clean.slice(1, -1).trim();
    }

    clean = clean.replace(/\r\n/g, ' ').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();

    if (!includePunctuation) {
      clean = clean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»—–]/g, '').replace(/\s{2,}/g, ' ').trim();
    }

    if (!includeNumbers) {
      clean = clean.replace(/[0-9]/g, '').replace(/\s{2,}/g, ' ').trim();
    }

    return clean;
  }

  /**
   * Быстрый тематический локальный генератор с учётом выбранной темы, языка и длины
   */
  private generateLocalFallbackText(
    language: string,
    topic: string = '',
    length: string = 'medium',
    includeNumbers: boolean = false,
    includePunctuation: boolean = true,
  ): string {
    const isRu = language === 'ru';
    const normTopic = topic.toLowerCase();

    const ruPools: Record<string, string[]> = {
      banana: [
        'Спелый банан содержит много калия и витаминов, которые стимулируют работу мозга и заряжают энергией для быстрой печати.',
        'Банановый коктейль перед тренировкой поднимает настроение и помогает пальцам легко скользить по клавишам без единой опечатки.',
        'Если бы клавиатуры росли на пальмах рядом с бананами, каждый программист печатал бы со скоростью молнии каждый рабочий день.',
      ],
      it: [
        'Чистый и понятный код пишется намного быстрее, когда пальцы уверенно находят нужные клавиши вслепую без взгляда на клавиатуру.',
        'Современная веб-разработка объединяет реактивные интерфейсы, асинхронные потоки данных и надёжную архитектуру серверных сервисов.',
        'Опытный разработчик ценит простоту решений, автоматические тесты и удобные инструменты, экономящие часы работы всей команды.',
      ],
      space: [
        'В бескрайнем космосе сияют миллиарды далёких звёзд, а современные орбитальные телескопы ежедневно открывают тайны нашей Вселенной.',
        'Исследование марсианских долин и далёких ледяных спутников вдохновляет инженеров создавать умные автономные космические аппараты.',
        'Квантовые алгоритмы и лазерная связь выводят скорость передачи научных данных на совершенно новый фантастический уровень.',
      ],
      quotes: [
        'Спокойствие и ровный ритм движений всегда побеждают спешку, потому что высокая точность со временем превращается в рекордную скорость.',
        'Маленькие ежедневные тренировки формируют прочную мышечную память, которая остаётся с вами на долгие годы продуктивной работы.',
        'Умение быстро переносить свои мысли на экран освобождает внимание для самых смелых идей, творчества и сложных проектов.',
      ],
    };

    const enPools: Record<string, string[]> = {
      banana: [
        'Ripe bananas are rich in potassium and vitamins that keep your mind sharp and energized during fast touch typing sessions.',
        'A fresh banana smoothie in the morning brings natural fuel for building creative applications without typos or fatigue.',
        'If keyboards grew on tropical palm trees beside bananas, every developer would comfortably type five hundred characters per minute.',
      ],
      it: [
        'Clean and maintainable code flows naturally onto the screen when your fingers move effortlessly across every row without looking down.',
        'Modern web engineering combines reactive user interfaces, asynchronous pipelines, and resilient backend architectures for millions of users.',
        'Great software developers appreciate simplicity, automated testing, and reliable tools that save valuable hours every single week.',
      ],
      space: [
        'Billions of distant stars shine across deep space while orbital observatories uncover remarkable mysteries of our expanding universe.',
        'Exploring Martian canyons and icy moons inspires aerospace engineers to build clever autonomous robots for distant voyages.',
        'Optical laser communication and quantum computing push scientific data transmission toward extraordinary new horizons.',
      ],
      quotes: [
        'Smooth rhythm and steady focus always beat rushing, because consistent accuracy naturally grows into effortless typing velocity.',
        'Small deliberate daily habits build lasting muscle memory that stays with you through years of creative and technical work.',
        'Turning clear thoughts into crisp text on screen frees your attention for solving challenging problems and inventing great products.',
      ],
    };

    const pools = isRu ? ruPools : enPools;
    let bucketKey = 'quotes';
    if (normTopic.includes('банан') || normTopic.includes('banana')) bucketKey = 'banana';
    else if (normTopic.includes('it') || normTopic.includes('код') || normTopic.includes('програм') || normTopic.includes('tech')) bucketKey = 'it';
    else if (normTopic.includes('космос') || normTopic.includes('наук') || normTopic.includes('space') || normTopic.includes('science')) bucketKey = 'space';
    else if (normTopic.includes('случайн') || normTopic.includes('random')) {
      const keys = Object.keys(pools);
      bucketKey = keys[Math.floor(Math.random() * keys.length)];
    }

    const candidates = [...pools[bucketKey]];
    const allOther = Object.entries(pools)
      .filter(([k]) => k !== bucketKey)
      .flatMap(([, arr]) => arr);

    const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    let chosen = pickRandom(candidates);

    if (length === 'medium' || length === 'long') {
      const second = pickRandom(candidates.length > 1 ? candidates.filter((c) => c !== chosen) : allOther);
      chosen = `${chosen} ${second}`;
    }
    if (length === 'long') {
      const third = pickRandom(allOther);
      chosen = `${chosen} ${third}`;
    }

    if (includeNumbers) {
      chosen = isRu
        ? `${chosen} В 2026 году цель — от 80 до 100 слов в минуту.`
        : `${chosen} In 2026, aiming for 80 to 100 words per minute feels great.`;
    }

    if (!includePunctuation) {
      chosen = chosen.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»—–]/g, '').replace(/\s{2,}/g, ' ').trim();
    }

    return chosen;
  }
}
