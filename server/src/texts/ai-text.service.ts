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

    // 1. Если задан GEMINI_API_KEY, в первую очередь используем Google Gemini (быстро и качественно)
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      try {
        const textFromGemini = await this.callGeminiAi(geminiKey, language, topic, difficulty, length);
        if (textFromGemini && textFromGemini.length > 20) {
          return {
            text: this.cleanGeneratedText(textFromGemini),
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
      const textFromPollinations = await this.callPollinationsAi(language, topic, difficulty, length);
      if (textFromPollinations && textFromPollinations.length > 20) {
        return {
          text: this.cleanGeneratedText(textFromPollinations),
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
    const localText = this.generateLocalFallbackText(language, topic);
    return {
      text: localText,
      source: 'ai (local-fallback)',
      topic,
      language,
    };
  }

  /**
   * Провайдер Pollinations.ai (без необходимости API-ключа)
   */
  private async callPollinationsAi(
    language: string,
    topic: string,
    difficulty: string,
    length: string,
  ): Promise<string> {
    const wordCount = length === 'short' ? '15-25' : length === 'long' ? '50-80' : '25-45';
    const langPrompt = language === 'ru' ? 'на русском языке' : 'in English';

    const prompt = language === 'ru'
      ? `Напиши связный, грамотный и интересный текст для тренажера слепой печати ${langPrompt}. Тема: "${topic}". Длина: примерно ${wordCount} слов. Сложность: ${difficulty}. Не используй кавычки вокруг всего текста, не пиши приветствий или объяснений, выведи ТОЛЬКО сам текст для набора.`
      : `Write a coherent, inspiring typing test paragraph ${langPrompt}. Topic: "${topic}". Length: about ${wordCount} words. Difficulty: ${difficulty}. Output ONLY the raw text to type, no intro, no markdown quotes.`;

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
  ): Promise<string> {
    const cleanKey = apiKey.trim();
    const wordCount = length === 'short' ? '15-25' : length === 'long' ? '50-80' : '25-45';
    const langPrompt = language === 'ru' ? 'на русском языке' : 'in English';
    const promptText = `Напиши текст для тренажера скоропечатания ${langPrompt} на тему "${topic}". Длина: ${wordCount} слов. Сложность: ${difficulty}. Выведи ТОЛЬКО текст для набора без кавычек и комментариев.`;

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
   * Очистка ответа от вводных фраз, кавычек и markdown
   */
  private cleanGeneratedText(raw: string): string {
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
    clean = clean.replace(/\r\n/g, ' ').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ');

    return clean;
  }

  /**
   * Умный динамический генератор при отсутствии интернета или недоступности внешних API
   */
  private generateLocalFallbackText(language: string, topic?: string): string {
    const isRu = language === 'ru';

    const ruTexts = [
      'Бананы содержат много калия и витаминов, которые стимулируют работу мозга и улучшают концентрацию при скоростной печати на клавиатуре.',
      'Регулярные тренировки слепого десятипальцевого метода позволяют печатать со скоростью мысли и значительно экономить время при работе с кодом.',
      'Современная веб-разработка сочетает в себе эстетику интерфейсов, реактивные компоненты и надежные базы данных для миллионов пользователей.',
      'Искусственный интеллект помогает автоматизировать рутинные задачи, генерировать идеи и создавать персональные образовательные программы.',
      'Спокойствие и ритмичность движений — главный секрет высокой скорости печати. Пальцы должны легко скользить по клавишам без лишнего напряжения.',
      'Каждая строчка чистого кода приближает проект к совершенству. Внимание к деталям и хорошая архитектура делают систему устойчивой к любым нагрузкам.',
      'Изучение новых технологий открывает широкие горизонты. Главное — не бояться сложных задач и ежедневно практиковаться в выбранном направлении.',
      'Банановый коктейль перед утренней тренировкой заряжает энергией на весь рабочий день и поднимает настроение всей команде программистов.',
      'В бескрайнем космосе сияют миллиарды далеких звезд, а космические телескопы ежедневно открывают удивительные тайны нашей Вселенной.',
      'Умение быстро формулировать свои мысли и мгновенно переносить их на экран — ключевой навык современного цифрового специалиста.'
    ];

    const enTexts = [
      'Bananas are rich in potassium and nutrients that boost cognitive function and help maintain focus during intense typing sessions.',
      'Touch typing allows your fingers to move automatically while your mind stays fully focused on creating clean and elegant software.',
      'Modern web applications rely on responsive user interfaces, real-time reactive stores, and robust database architectures.',
      'Artificial intelligence empowers developers to automate repetitive workflows, build smart assistants, and craft engaging user experiences.',
      'Maintaining a smooth, steady rhythm across the keyboard is more important than raw speed. Accuracy always leads to effortless typing velocity.',
      'Every line of well-structured code brings clarity to complex systems. Good architecture is the cornerstone of sustainable software engineering.',
      'Curiosity and daily deliberate practice are the two greatest drivers of mastery in both programming and touch typing.',
      'A fresh banana smoothie in the morning provides natural fuel for a productive day of building creative applications.',
      'Deep learning models continue to transform how humans interact with technology, opening new frontiers in education and science.',
      'Consistency turns small daily habits into extraordinary accomplishments. Keep your fingers active and enjoy every practice session.'
    ];

    const pool = isRu ? ruTexts : enTexts;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }
}
