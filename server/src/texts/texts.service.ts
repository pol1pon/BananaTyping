import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Text } from '../database/entities/text.entity';
import { CreateTextDto } from './dto/create-text.dto';
import { UpdateTextDto } from './dto/update-text.dto';
import { GenerateTextDto } from './dto/generate-text.dto';
import { AiTextService } from './ai-text.service';

@Injectable()
export class TextsService implements OnModuleInit {
  private readonly logger = new Logger(TextsService.name);
  public static readonly MAX_TEXTS_PER_TOPIC = 100;

  constructor(
    @InjectRepository(Text)
    private readonly textRepository: Repository<Text>,
    private readonly aiTextService: AiTextService,
  ) {}

  async onModuleInit() {
    await this.seedInitialTextsIfEmpty();
  }

  /**
   * Подсчет количества текстов в базе данных по теме (регистронезависимо)
   */
  private async getTopicCount(topic: string): Promise<number> {
    const trimmed = topic.trim();
    return this.textRepository.createQueryBuilder('text')
      .where('LOWER(TRIM(text.topic)) = LOWER(:topic)', { topic: trimmed })
      .getCount();
  }

  /**
   * Генерация текста через ИИ с автоматическим сохранением в базу данных.
   * При накоплении 100 текстов на одну тему запись в БД пропускается для экономии места на сервере.
   */
  async generateAndSave(dto: GenerateTextDto = {}): Promise<Text> {
    const aiResult = await this.aiTextService.generateText(dto);

    const newText = this.textRepository.create({
      content: aiResult.text,
      word: aiResult.text, // обратная совместимость
      language: aiResult.language,
      topic: aiResult.topic,
      difficulty: dto.difficulty || 'medium',
      source: aiResult.source,
      hasNumbers: dto.includeNumbers ?? false,
      hasPunctuation: dto.includePunctuation ?? true,
      createdAt: new Date(),
    });

    // Проверяем лимит в 100 текстов на тему
    const topic = aiResult.topic?.trim();
    if (topic) {
      const count = await this.getTopicCount(topic);
      if (count >= TextsService.MAX_TEXTS_PER_TOPIC) {
        this.logger.log(
          `Лимит в ${TextsService.MAX_TEXTS_PER_TOPIC} текстов для темы "${topic}" достигнут (в базе уже ${count}). Новый текст выдан для тренировки, но не сохранен в БД для экономии диска.`,
        );
        newText.id = 0;
        return newText;
      }
    }

    try {
      const saved = await this.textRepository.save(newText);
      this.logger.log(`Сгенерирован и сохранен новый текст (ID: ${saved.id}, язык: ${saved.language}, источник: ${saved.source})`);
      return saved;
    } catch (dbErr: any) {
      this.logger.warn(`Не удалось сохранить сгенерированный текст в БД: ${dbErr?.message || dbErr}. Возвращаем текст без сохранения.`);
      newText.id = 0;
      return newText;
    }
  }

  /**
   * Получить случайный текст из базы данных.
   * Поддерживает исключение текущего ID, чтобы текст никогда не повторялся подряд.
   * Если база пуста, автоматически генерирует уникальный текст через ИИ.
   */
  async getRandom(language?: string, excludeId?: number): Promise<Text> {
    const query = this.textRepository.createQueryBuilder('text');
    if (language) {
      query.where('text.language = :language', { language });
    }
    if (excludeId) {
      query.andWhere('text.id != :excludeId', { excludeId });
    }
    query.orderBy('RANDOM()');
    let randomText = await query.getOne();

    // Если нет других текстов кроме исключенного, берем любой доступный для данного языка
    if (!randomText && excludeId) {
      const fallbackQuery = this.textRepository.createQueryBuilder('text');
      if (language) {
        fallbackQuery.where('text.language = :language', { language });
      }
      fallbackQuery.orderBy('RANDOM()');
      randomText = await fallbackQuery.getOne();
    }

    if (randomText) {
      return randomText;
    }

    // Если база пуста для данного языка, сгенерируем текст через ИИ и сохраним
    return this.generateAndSave({ language: (language as 'ru' | 'en') || 'ru' });
  }

  /**
   * Создание текста вручную (также с учетом лимита 100 текстов на тему)
   */
  async create(createTextDto: CreateTextDto): Promise<Text> {
    const content = createTextDto.content || createTextDto.word || '';
    const topic = createTextDto.topic?.trim();

    const text = this.textRepository.create({
      ...createTextDto,
      content,
      word: createTextDto.word || content,
      language: createTextDto.language || 'ru',
      source: createTextDto.source || 'manual',
      createdAt: new Date(),
    });

    if (topic) {
      const count = await this.getTopicCount(topic);
      if (count >= TextsService.MAX_TEXTS_PER_TOPIC) {
        this.logger.warn(
          `Лимит в ${TextsService.MAX_TEXTS_PER_TOPIC} текстов для темы "${topic}" достигнут. Текст не записан в БД.`,
        );
        text.id = 0;
        return text;
      }
    }

    return this.textRepository.save(text);
  }

  /**
   * Получение всех текстов с возможностью фильтрации по языку
   */
  async findAll(language?: string): Promise<Text[]> {
    if (language) {
      return this.textRepository.find({
        where: { language },
        order: { createdAt: 'DESC' },
      });
    }
    return this.textRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Поиск текста по ID
   */
  async findOne(id: number): Promise<Text | null> {
    return this.textRepository.findOne({ where: { id } });
  }

  /**
   * Обновление текста
   */
  async update(id: number, updateTextDto: UpdateTextDto): Promise<Text | null> {
    const updateData: Partial<Text> = { ...updateTextDto };
    if (updateTextDto.content && !updateTextDto.word) {
      updateData.word = updateTextDto.content;
    }
    if (updateTextDto.word && !updateTextDto.content) {
      updateData.content = updateTextDto.word;
    }
    await this.textRepository.update(id, updateData);
    return this.textRepository.findOne({ where: { id } });
  }

  /**
   * Удаление текста
   */
  async remove(id: number): Promise<void> {
    await this.textRepository.delete(id);
  }

  /**
   * Начальное наполнение базы данных качественными текстами для тренировки
   */
  private async seedInitialTextsIfEmpty() {
    try {
      const existing = await this.textRepository.find();
      const existingContents = new Set(
        existing.map((t) => (t.content || t.word || '').trim().toLowerCase())
      );

      const seeds: Partial<Text>[] = [
        // Бананы и юмор
        {
          content: 'Бананы содержат много калия и витаминов, которые стимулируют работу мозга и улучшают концентрацию при скоростной печати на клавиатуре.',
          word: 'Бананы содержат много калия и витаминов, которые стимулируют работу мозга и улучшают концентрацию при скоростной печати на клавиатуре.',
          language: 'ru',
          topic: 'бананы и юмор',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Бананы — один из самых популярных фруктов в мире. Они богаты калием и дарят заряд бодрости на весь продуктивный рабочий день.',
          word: 'Бананы — один из самых популярных фруктов в мире. Они богаты калием и дарят заряд бодрости на весь продуктивный рабочий день.',
          language: 'ru',
          topic: 'бананы и юмор',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Банановый коктейль перед утренней тренировкой заряжает энергией на весь рабочий день и поднимает настроение всей команде программистов.',
          word: 'Банановый коктейль перед утренней тренировкой заряжает энергией на весь рабочий день и поднимает настроение всей команде программистов.',
          language: 'ru',
          topic: 'бананы и юмор',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Если бы клавиатуры росли на пальмах рядом с бананами, каждый программист печатал бы со скоростью триста знаков в минуту без единой ошибки.',
          word: 'Если бы клавиатуры росли на пальмах рядом с бананами, каждый программист печатал бы со скоростью триста знаков в минуту без единой ошибки.',
          language: 'ru',
          topic: 'бананы и юмор',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Научно доказано, что спелый желтый банан повышает уровень серотонина, а быстрая и безошибочная печать вызывает настоящее чувство триумфа.',
          word: 'Научно доказано, что спелый желтый банан повышает уровень серотонина, а быстрая и безошибочная печать вызывает настоящее чувство триумфа.',
          language: 'ru',
          topic: 'бананы и юмор',
          difficulty: 'medium',
          source: 'seed',
        },
        // Программирование и код
        {
          content: 'Каждая строчка чистого кода приближает проект к совершенству. Внимание к деталям и хорошая архитектура делают систему устойчивой к любым нагрузкам.',
          word: 'Каждая строчка чистого кода приближает проект к совершенству. Внимание к деталям и хорошая архитектура делают систему устойчивой к любым нагрузкам.',
          language: 'ru',
          topic: 'программирование',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Регулярные тренировки слепого десятипальцевого метода позволяют печатать со скоростью мысли и значительно экономить время при работе с кодом.',
          word: 'Регулярные тренировки слепого десятипальцевого метода позволяют печатать со скоростью мысли и значительно экономить время при работе с кодом.',
          language: 'ru',
          topic: 'программирование',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Опытный разработчик знает, что простота архитектуры важнее нагромождения сложных абстракций. Читаемый код спасает нервы всей команде.',
          word: 'Опытный разработчик знает, что простота архитектуры важнее нагромождения сложных абстракций. Читаемый код спасает нервы всей команде.',
          language: 'ru',
          topic: 'программирование',
          difficulty: 'medium',
          source: 'seed',
        },
        // Технологии и ИИ
        {
          content: 'Современная веб-разработка сочетает в себе эстетику интерфейсов, реактивные компоненты и надежные базы данных для миллионов пользователей.',
          word: 'Современная веб-разработка сочетает в себе эстетику интерфейсов, реактивные компоненты и надежные базы данных для миллионов пользователей.',
          language: 'ru',
          topic: 'технологии',
          difficulty: 'hard',
          source: 'seed',
        },
        {
          content: 'Алгоритмы оптимизации и асинхронные потоки данных позволяют обрабатывать запросы пользователей с молниеносной скоростью и минимальной задержкой.',
          word: 'Алгоритмы оптимизации и асинхронные потоки данных позволяют обрабатывать запросы пользователей с молниеносной скоростью и минимальной задержкой.',
          language: 'ru',
          topic: 'технологии',
          difficulty: 'hard',
          source: 'seed',
        },
        {
          content: 'Искусственный интеллект помогает автоматизировать рутинные задачи, генерировать идеи и создавать персональные образовательные программы.',
          word: 'Искусственный интеллект помогает автоматизировать рутинные задачи, генерировать идеи и создавать персональные образовательные программы.',
          language: 'ru',
          topic: 'технологии',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Современные нейросети способны анализировать терабайты информации за считанные секунды, помогая создавать удобные программные продукты.',
          word: 'Современные нейросети способны анализировать терабайты информации за считанные секунды, помогая создавать удобные программные продукты.',
          language: 'ru',
          topic: 'технологии',
          difficulty: 'hard',
          source: 'seed',
        },
        // Космос и наука
        {
          content: 'В бескрайнем космосе сияют миллиарды далеких звезд, а космические телескопы ежедневно открывают удивительные тайны нашей Вселенной.',
          word: 'В бескрайнем космосе сияют миллиарды далеких звезд, а космические телескопы ежедневно открывают удивительные тайны нашей Вселенной.',
          language: 'ru',
          topic: 'космос и наука',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Исследование марсианских равнин и глубоких океанов на ледяных спутниках Юпитера вдохновляет инженеров создавать новые поколения роботов.',
          word: 'Исследование марсианских равнин и глубоких океанов на ледяных спутниках Юпитера вдохновляет инженеров создавать новые поколения роботов.',
          language: 'ru',
          topic: 'космос и наука',
          difficulty: 'hard',
          source: 'seed',
        },
        {
          content: 'Квантовые вычисления и лазерная связь выводят цифровую безопасность и скорость передачи данных на совершенно фантастический уровень.',
          word: 'Квантовые вычисления и лазерная связь выводят цифровую безопасность и скорость передачи данных на совершенно фантастический уровень.',
          language: 'ru',
          topic: 'космос и наука',
          difficulty: 'hard',
          source: 'seed',
        },
        // Саморазвитие и продуктивность
        {
          content: 'Скоропечатание развивает моторику и улучшает память. Регулярные тренировки помогают достигать высоких результатов в работе и учебе.',
          word: 'Скоропечатание развивает моторику и улучшает память. Регулярные тренировки помогают достигать высоких результатов в работе и учебе.',
          language: 'ru',
          topic: 'саморазвитие',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Спокойствие и ритмичность движений — главный секрет высокой скорости печати. Пальцы должны легко скользить по клавишам без лишнего напряжения.',
          word: 'Спокойствие и ритмичность движений — главный секрет высокой скорости печати. Пальцы должны легко скользить по клавишам без лишнего напряжения.',
          language: 'ru',
          topic: 'саморазвитие',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Умение быстро формулировать свои мысли и мгновенно переносить их на экран — ключевой навык современного цифрового специалиста.',
          word: 'Умение быстро формулировать свои мысли и мгновенно переносить их на экран — ключевой навык современного цифрового специалиста.',
          language: 'ru',
          topic: 'продуктивность',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Маленькие ежедневные победы складываются в колоссальный успех. Даже десять минут осознанной практики в день меняют качество работы навсегда.',
          word: 'Маленькие ежедневные победы складываются в колоссальный успех. Даже десять минут осознанной практики в день меняют качество работы навсегда.',
          language: 'ru',
          topic: 'продуктивность',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Концентрация внимания подобна мышце, которую можно и нужно тренировать. Избавься от лишнего шума и сфокусируйся на текущем моменте.',
          word: 'Концентрация внимания подобна мышце, которую можно и нужно тренировать. Избавься от лишнего шума и сфокусируйся на текущем моменте.',
          language: 'ru',
          topic: 'продуктивность',
          difficulty: 'medium',
          source: 'seed',
        },
        // Жизнь и вдохновение
        {
          content: 'Чашка ароматного горячего кофе ранним утром создает идеальное настроение для покорения новых творческих и профессиональных вершин.',
          word: 'Чашка ароматного горячего кофе ранним утром создает идеальное настроение для покорения новых творческих и профессиональных вершин.',
          language: 'ru',
          topic: 'жизнь и мысли',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Свежий горный воздух и тишина хвойного леса помогают перезагрузить мысли после напряженной недели за монитором компьютера.',
          word: 'Свежий горный воздух и тишина хвойного леса помогают перезагрузить мысли после напряженной недели за монитором компьютера.',
          language: 'ru',
          topic: 'жизнь и мысли',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Путешествия по неизведанным уголкам планеты дарят незабываемые впечатления и учат видеть красоту в самых простых повседневных вещах.',
          word: 'Путешествия по неизведанным уголкам планеты дарят незабываемые впечатления и учат видеть красоту в самых простых повседневных вещах.',
          language: 'ru',
          topic: 'жизнь и мысли',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Музыка способна мгновенно менять ритм нашего восприятия, задавая нужный темп для продуктивной учебы или увлекательного творчества.',
          word: 'Музыка способна мгновенно менять ритм нашего восприятия, задавая нужный темп для продуктивной учебы или увлекательного творчества.',
          language: 'ru',
          topic: 'жизнь и мысли',
          difficulty: 'easy',
          source: 'seed',
        },
        // Английские тексты (English seeds)
        {
          content: 'Bananas are delicious, healthy, and packed with vitamins that keep your brain sharp during intense programming tasks.',
          word: 'Bananas are delicious, healthy, and packed with vitamins that keep your brain sharp during intense programming tasks.',
          language: 'en',
          topic: 'bananas',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Bananas are rich in potassium and nutrients that boost cognitive function and help maintain focus during intense typing sessions.',
          word: 'Bananas are rich in potassium and nutrients that boost cognitive function and help maintain focus during intense typing sessions.',
          language: 'en',
          topic: 'bananas',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'A fresh banana smoothie in the morning provides natural fuel for a productive day of building creative applications.',
          word: 'A fresh banana smoothie in the morning provides natural fuel for a productive day of building creative applications.',
          language: 'en',
          topic: 'bananas',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'If bananas could type on keyboards, they would probably hit five hundred words per minute with zero typos.',
          word: 'If bananas could type on keyboards, they would probably hit five hundred words per minute with zero typos.',
          language: 'en',
          topic: 'bananas',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Touch typing allows your fingers to move automatically while your mind stays fully focused on creating clean and elegant software.',
          word: 'Touch typing allows your fingers to move automatically while your mind stays fully focused on creating clean and elegant software.',
          language: 'en',
          topic: 'programming',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Modern web applications rely on responsive user interfaces, real-time reactive stores, and robust database architectures.',
          word: 'Modern web applications rely on responsive user interfaces, real-time reactive stores, and robust database architectures.',
          language: 'en',
          topic: 'technology',
          difficulty: 'hard',
          source: 'seed',
        },
        {
          content: 'Every line of well-structured code brings clarity to complex systems. Good architecture is the cornerstone of sustainable software engineering.',
          word: 'Every line of well-structured code brings clarity to complex systems. Good architecture is the cornerstone of sustainable software engineering.',
          language: 'en',
          topic: 'programming',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Great software developers value simplicity and clarity over convoluted cleverness. Write code that your future self will thank you for.',
          word: 'Great software developers value simplicity and clarity over convoluted cleverness. Write code that your future self will thank you for.',
          language: 'en',
          topic: 'programming',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Deep learning models continue to transform how humans interact with technology, opening new frontiers in education and science.',
          word: 'Deep learning models continue to transform how humans interact with technology, opening new frontiers in education and science.',
          language: 'en',
          topic: 'technology',
          difficulty: 'hard',
          source: 'seed',
        },
        {
          content: 'Looking up at distant galaxies through modern space observatories reminds us of the endless mysteries waiting to be unlocked.',
          word: 'Looking up at distant galaxies through modern space observatories reminds us of the endless mysteries waiting to be unlocked.',
          language: 'en',
          topic: 'science',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Artificial intelligence empowers developers to automate repetitive workflows, build smart assistants, and craft engaging user experiences.',
          word: 'Artificial intelligence empowers developers to automate repetitive workflows, build smart assistants, and craft engaging user experiences.',
          language: 'en',
          topic: 'technology',
          difficulty: 'hard',
          source: 'seed',
        },
        {
          content: 'Typing fast improves motor skills and enhances memory. Regular practice helps achieve high results in work and studies.',
          word: 'Typing fast improves motor skills and enhances memory. Regular practice helps achieve high results in work and studies.',
          language: 'en',
          topic: 'productivity',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Maintaining a smooth, steady rhythm across the keyboard is more important than raw speed. Accuracy always leads to effortless typing velocity.',
          word: 'Maintaining a smooth, steady rhythm across the keyboard is more important than raw speed. Accuracy always leads to effortless typing velocity.',
          language: 'en',
          topic: 'productivity',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Curiosity and daily deliberate practice are the two greatest drivers of mastery in both programming and touch typing.',
          word: 'Curiosity and daily deliberate practice are the two greatest drivers of mastery in both programming and touch typing.',
          language: 'en',
          topic: 'productivity',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Consistency turns small daily habits into extraordinary accomplishments. Keep your fingers active and enjoy every practice session.',
          word: 'Consistency turns small daily habits into extraordinary accomplishments. Keep your fingers active and enjoy every practice session.',
          language: 'en',
          topic: 'productivity',
          difficulty: 'easy',
          source: 'seed',
        },
      ];

      let addedCount = 0;
      for (const item of seeds) {
        const itemContent = (item.content || '').trim().toLowerCase();
        if (!existingContents.has(itemContent)) {
          const text = this.textRepository.create(item);
          await this.textRepository.save(text);
          existingContents.add(itemContent);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        this.logger.log(`Успешно добавлено ${addedCount} новых качественных текстов в базу данных!`);
      }
    } catch (e: any) {
      this.logger.error(`Ошибка при посеве начальных данных: ${e?.message || e}`);
    }
  }
}
