import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateTextDto } from './dto/generate-text.dto';

interface GeneratedResult {
  text: string;
  source: string;
  topic: string;
  language: string;
}

@Injectable()
export class AiTextService {
  private readonly logger = new Logger(AiTextService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Генерация текста через ИИ
   */
  async generateText(options: GenerateTextDto = {}): Promise<GeneratedResult> {
    const language = options.language || 'ru';
    const topic = options.topic || (language === 'ru' ? 'случайная тема' : 'random');
    const difficulty = options.difficulty || 'medium';
    const length = options.length || 'medium';
    const includeNumbers = options.includeNumbers ?? false;
    const includePunctuation = options.includePunctuation ?? true;

    // 1. Если задан GEMINI_API_KEY, в первую очередь используем Google Gemini (быстро и качественно)
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
          includePunctuation
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

    // 2. Резервный провайдер Pollinations.ai
    try {
      const textFromPollinations = await this.callPollinationsAi(
        language, 
        topic, 
        difficulty, 
        length, 
        includeNumbers, 
        includePunctuation
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
      this.logger.warn(`Pollinations AI error or timeout: ${err?.message || err}.`);
    }

    // 3. Если сеть недоступна (офлайн/песочница/сбой API), используем локальный генератор текстов
    this.logger.log('Используется локальный генератор текстов для слепой печати');
    const localText = this.generateLocalFallbackText(
      language, 
      topic, 
      length, 
      includeNumbers, 
      includePunctuation
    );
    return {
      text: localText,
      source: 'ai (local-fallback)',
      topic,
      language,
    };
  }

  /**
   * Получить словесное описание диапазона символов для промпта
   * Короткий: 150 - 200 символов
   * Средний: 201 - 290 символов
   * Длинный: 291 - 400 символов
   */
  private getLengthGuide(length: string, language: string): string {
    if (language === 'ru') {
      switch (length) {
        case 'short':
          return 'от 150 до 200 символов (включая пробелы)';
        case 'long':
          return 'от 291 до 400 символов (включая пробелы)';
        case 'medium':
        default:
          return 'от 201 до 290 символов (включая пробелы)';
      }
    } else {
      switch (length) {
        case 'short':
          return 'between 150 and 200 characters (including spaces)';
        case 'long':
          return 'between 291 and 400 characters (including spaces)';
        case 'medium':
        default:
          return 'between 201 and 290 characters (including spaces)';
      }
    }
  }

  /**
   * Сформировать правила пунктуации и цифр для промпта
   */
  private formatTextRules(includeNumbers: boolean, includePunctuation: boolean, language: string): string {
    if (language === 'ru') {
      let rules = '';
      if (includeNumbers) {
        rules += 'Обязательно включи в текст несколько цифр или чисел (например, 2026, 100%, 42, 5-10).\n';
      } else {
        rules += 'Не используй цифры, пиши всё только буквами.\n';
      }

      if (!includePunctuation) {
        rules += 'НЕ используй знаки препинания (без точек, запятых, тире и кавычек). Разделяй слова только одиночными пробелами.\n';
      } else {
        rules += 'Используй стандартную пунктуацию (точки, запятые, тире).\n';
      }
      return rules;
    } else {
      let rules = '';
      if (includeNumbers) {
        rules += 'Include several numbers or digits in the text (e.g. 2026, 100%, 42).\n';
      } else {
        rules += 'Do not use digits or numbers, spell out everything in words.\n';
      }

      if (!includePunctuation) {
        rules += 'Do NOT use punctuation marks (no periods, commas, dashes, quotes). Separate words only with single spaces.\n';
      } else {
        rules += 'Use standard punctuation (periods, commas, dashes).\n';
      }
      return rules;
    }
  }

  /**
   * Провайдер Pollinations.ai (без необходимости API-ключа)
   */
  private async callPollinationsAi(
    language: string,
    topic: string,
    difficulty: string,
    length: string,
    includeNumbers: boolean = false,
    includePunctuation: boolean = true,
  ): Promise<string> {
    const lengthGuide = this.getLengthGuide(length, language);
    const rules = this.formatTextRules(includeNumbers, includePunctuation, language);

    const prompt = language === 'ru'
      ? `Напиши связный, грамотный и интересный текст для тренажера скоропечатания на русском языке. Тема: "${topic}". Длина: СТРОГО ${lengthGuide}. Сложность: ${difficulty}.\n${rules}Не используй кавычки вокруг всего текста, не пиши приветствий или объяснений, выведи ТОЛЬКО сам текст для набора.`
      : `Write a coherent, inspiring typing test paragraph in English. Topic: "${topic}". Length: STRICTLY ${lengthGuide}. Difficulty: ${difficulty}.\n${rules}Output ONLY the raw text to type, no intro, no markdown quotes.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
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

  /**
   * Запрос к Google Gemini с авто-подбором актуальной модели (gemini-3.5-flash / gemini-3.5-flash-lite)
   */
  private async callGeminiAi(
    apiKey: string,
    language: string,
    topic: string,
    difficulty: string,
    length: string,
    includeNumbers: boolean = false,
    includePunctuation: boolean = true,
  ): Promise<string> {
    const cleanKey = apiKey.trim();
    const lengthGuide = this.getLengthGuide(length, language);
    const rules = this.formatTextRules(includeNumbers, includePunctuation, language);

    const promptText = language === 'ru'
      ? `Напиши связный текст для тренажера скоропечатания на русском языке на тему "${topic}".\nДлина: СТРОГО ${lengthGuide}.\nСложность: ${difficulty}.\n${rules}\nВыведи ТОЛЬКО текст для набора без кавычек и комментариев.`
      : `Write a coherent paragraph for typing practice in English on the topic "${topic}".\nLength: STRICTLY ${lengthGuide}.\nDifficulty: ${difficulty}.\n${rules}\nOutput ONLY the text to type without quotes or intro.`;

    const modelsToTry = [
      'gemini-flash-lite-latest',
      'gemini-3-flash-preview',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
    ];

    for (const model of modelsToTry) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
            }),
            signal: controller.signal,
          },
        );

        if (res.ok) {
          const data: any = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 15) {
            return text.trim();
          }
        } else {
          const errData: any = await res.json().catch(() => ({}));
          this.logger.warn(
            `Gemini (${model}) HTTP ${res.status}: ${errData?.error?.message || res.statusText}`,
          );
        }
      } catch (err: any) {
        this.logger.warn(`Попытка генерации через Gemini (${model}) не удалась: ${err?.message || err}`);
      } finally {
        clearTimeout(timeout);
      }
    }

    return '';
  }

  /**
   * Очистка ответа от вводных фраз, кавычек и markdown, а также соблюдение настроек пунктуации и цифр
   */
  private cleanGeneratedText(
    raw: string, 
    includeNumbers: boolean = false, 
    includePunctuation: boolean = true
  ): string {
    let clean = raw.trim();

    // Удаляем markdown разметку ```...```
    if (clean.startsWith('```') && clean.endsWith('```')) {
      clean = clean.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();
    }

    // Удаляем типовые вступительные слова нейросетей
    clean = clean.replace(/^(Вот текст для (тренировки|набора|слепой печати|тебя):?\s*)/i, '');
    clean = clean.replace(/^(Here is a (text|paragraph|typing practice):?\s*)/i, '');

    // Удаляем внешние кавычки
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith('«') && clean.endsWith('»'))) {
      clean = clean.slice(1, -1).trim();
    }

    // Нормализуем пробелы и переносы
    clean = clean.replace(/\r\n/g, ' ').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // Если знаки пунктуации отключены: удаляем все знаки препинания
    if (!includePunctuation) {
      clean = clean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»—–]/g, '').replace(/\s{2,}/g, ' ').trim();
    }

    // Если цифры отключены: удаляем цифры
    if (!includeNumbers) {
      clean = clean.replace(/[0-9]/g, '').replace(/\s{2,}/g, ' ').trim();
    }

    return clean;
  }

  /**
   * Умный динамический генератор при отсутствии интернета или недоступности внешних API
   * Поддерживает точные размеры:
   * Короткий: 150 - 200 символов
   * Средний: 201 - 290 символов
   * Длинный: 291 - 400 символов
   */
  private generateLocalFallbackText(
    language: string, 
    topic?: string, 
    length: string = 'medium',
    includeNumbers: boolean = false,
    includePunctuation: boolean = true
  ): string {
    const isRu = language === 'ru';

    // Короткие тексты (150 - 200 символов)
    const ruShort = [
      'Бананы содержат много калия и витаминов, которые стимулируют работу мозга, укрепляют память и заметно улучшают концентрацию при скоростной печати на клавиатуре.',
      'Регулярные тренировки слепого десятипальцевого метода позволяют печатать со скоростью мысли и значительно экономить драгоценное время при повседневной работе с кодом.',
      'В бескрайнем космосе сияют миллиарды далеких звезд, а современные космические телескопы ежедневно открывают удивительные и захватывающие тайны нашей Вселенной.'
    ];

    // Средние тексты (201 - 290 символов)
    const ruMedium = [
      'Бананы дарят заряд энергии на весь день. Регулярная практика слепого набора развивает моторику пальцев, ускоряет мышление и помогает легко переносить любые творческие мысли прямо на экран компьютера без лишнего напряжения.',
      'Искусственный интеллект открывает новые горизонты в программировании. Чистый код и уверенное владение клавиатурой экономят часы работы, позволяя всецело сосредоточиться на создании действительно полезных и красивых цифровых решений.',
      'Современная веб-разработка сочетает в себе эстетику интерфейсов, реактивные компоненты и надежные базы данных для миллионов пользователей по всему миру. Главное — писать читаемый, надежный и легко масштабируемый программный код.'
    ];

    // Длинные тексты (291 - 400 символов)
    const ruLong = [
      'Современные технологии развиваются с невероятной скоростью. Умение быстро и грамотно набирать текст вслепую — один из самых ценных и востребованных навыков для любого разработчика. Спокойный ритм, правильная осанка и регулярные тренировки творят настоящие чудеса, превращая рутинный ввод данных в сплошное эстетическое удовольствие.',
      'Космические исследования вдохновляют человечество на смелые научные открытия. Далекие неизведанные галактики, орбитальные станции и мощнейшие квантовые телескопы помогают лучше понять фундаментальные законы природы. Каждый уверенный шаг вперед требует терпения, глубокой концентрации и постоянного оттачивания своего мастерства день за днем.'
    ];

    // Короткие тексты на английском (150 - 200 символов)
    const enShort = [
      'Bananas are rich in potassium and essential nutrients that boost cognitive function, relieve fatigue, and help maintain focus during intense typing sessions.',
      'Touch typing allows your fingers to move automatically across the keyboard while your mind stays fully focused on creating clean and elegant software.',
      'Deep learning models continue to transform how humans interact with technology, opening exciting new frontiers in education, engineering, and modern science.'
    ];

    // Средние тексты на английском (201 - 290 символов)
    const enMedium = [
      'Modern web applications rely on responsive user interfaces, real-time reactive stores, and robust database architectures. Writing clean and sustainable code is an art that requires patience, continuous practice, and genuine dedication.',
      'Great software developers value simplicity and clarity over convoluted cleverness. Write code that your future self and your teammates will easily understand, maintain with confidence, and genuinely enjoy working with.',
      'Maintaining a smooth, steady rhythm across the keyboard is far more important than raw speed. Accuracy always leads to effortless typing velocity and prevents cognitive fatigue throughout long productive workdays.'
    ];

    // Длинные тексты на английском (291 - 400 символов)
    const enLong = [
      'Consistency turns small daily habits into extraordinary accomplishments. When you practice touch typing every single day, your fingers develop natural muscle memory that allows you to express your thoughts freely and effortlessly without ever looking down at the keyboard keys or breaking your creative flow.',
      'The exploration of deep space and planetary systems requires international scientific cooperation, advanced computational algorithms, and relentless curiosity. Every discovery expands human perspective, inspires future generations, and pushes the boundaries of our technological civilization forward.'
    ];

    const poolRu = length === 'short' ? ruShort : length === 'long' ? ruLong : ruMedium;
    const poolEn = length === 'short' ? enShort : length === 'long' ? enLong : enMedium;
    const pool = isRu ? poolRu : poolEn;
    let chosen = pool[Math.floor(Math.random() * pool.length)];

    if (includeNumbers) {
      chosen = isRu 
        ? chosen.replace(/(бананы|технологии|звезд|код|интеллект)/i, '$1 в 2026 году') 
        : chosen.replace(/(bananas|systems|models|code|software)/i, '$1 in 2026');
    }

    if (!includePunctuation) {
      chosen = chosen.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»—–]/g, '').replace(/\s{2,}/g, ' ').trim();
    }

    return chosen;
  }
}
