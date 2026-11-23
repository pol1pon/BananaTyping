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

  constructor(
    @InjectRepository(Text)
    private readonly textRepository: Repository<Text>,
    private readonly aiTextService: AiTextService,
  ) {}

  async onModuleInit() {
    await this.seedInitialTextsIfEmpty();
  }

  /**
   * Генерация текста через бесплатную нейросеть с автоматическим сохранением в SQLite
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
    });

    const saved = await this.textRepository.save(newText);
    this.logger.log(`Сгенерирован и сохранен в SQLite новый текст (ID: ${saved.id}, язык: ${saved.language}, источник: ${saved.source})`);
    return saved;
  }

  /**
   * Получить случайный текст из SQLite базы данных.
   * Если текстов выбранного языка еще нет, автоматически генерирует через нейросеть!
   */
  async getRandom(language?: string): Promise<Text> {
    const query = this.textRepository.createQueryBuilder('text');
    if (language) {
      query.where('text.language = :language', { language });
    }
    query.orderBy('RANDOM()');
    const randomText = await query.getOne();

    if (randomText) {
      return randomText;
    }

    // Если база пуста для данного языка, сгенерируем текст через нейросеть и сохраним
    return this.generateAndSave({ language: (language as 'ru' | 'en') || 'ru' });
  }

  /**
   * Создание текста вручную
   */
  async create(createTextDto: CreateTextDto): Promise<Text> {
    const content = createTextDto.content || createTextDto.word || '';
    const text = this.textRepository.create({
      ...createTextDto,
      content,
      word: createTextDto.word || content,
      language: createTextDto.language || 'ru',
      source: createTextDto.source || 'manual',
    });
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
   * Начальное наполнение SQLite базы данных текстами для тренировки
   */
  private async seedInitialTextsIfEmpty() {
    try {
      const count = await this.textRepository.count();
      if (count > 0) {
        return;
      }

      this.logger.log('Инициализация базы данных SQLite стартовыми текстами...');

      const seeds: Partial<Text>[] = [
        {
          content: 'Скоропечатание развивает моторику и улучшает память. Регулярные тренировки помогают достигать высоких результатов в работе и учебе.',
          word: 'Скоропечатание развивает моторику и улучшает память. Регулярные тренировки помогают достигать высоких результатов в работе и учебе.',
          language: 'ru',
          topic: 'саморазвитие',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Бананы — один из самых популярных фруктов в мире. Они богаты калием и дарят заряд бодрости на весь продуктивный рабочий день.',
          word: 'Бананы — один из самых популярных фруктов в мире. Они богаты калием и дарят заряд бодрости на весь продуктивный рабочий день.',
          language: 'ru',
          topic: 'бананы',
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
        {
          content: 'Typing fast improves motor skills and enhances memory. Regular practice helps achieve high results in work and studies.',
          word: 'Typing fast improves motor skills and enhances memory. Regular practice helps achieve high results in work and studies.',
          language: 'en',
          topic: 'productivity',
          difficulty: 'easy',
          source: 'seed',
        },
        {
          content: 'Bananas are delicious, healthy, and packed with vitamins that keep your brain sharp during intense programming tasks.',
          word: 'Bananas are delicious, healthy, and packed with vitamins that keep your brain sharp during intense programming tasks.',
          language: 'en',
          topic: 'bananas',
          difficulty: 'medium',
          source: 'seed',
        },
        {
          content: 'Artificial intelligence and neural networks are opening new horizons for developers around the globe every single day.',
          word: 'Artificial intelligence and neural networks are opening new horizons for developers around the globe every single day.',
          language: 'en',
          topic: 'technology',
          difficulty: 'hard',
          source: 'seed',
        },
      ];

      for (const item of seeds) {
        const text = this.textRepository.create(item);
        await this.textRepository.save(text);
      }

      this.logger.log(`Успешно добавлено ${seeds.length} стартовых текстов в SQLite базу!`);
    } catch (e: any) {
      this.logger.error(`Ошибка при посеве начальных данных: ${e?.message || e}`);
    }
  }
}
