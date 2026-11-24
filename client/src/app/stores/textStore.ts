import { create } from 'zustand';
import { client } from './api-client';
import { 
  textsControllerRandom, 
  textsControllerGenerate, 
  textsControllerFindAll 
} from '../../client/sdk.gen';
import type { Text, GenerateTextDto } from '../../client/types.gen';

// Пул качественных текстов на случай отсутствия соединения или первичного офлайн-выбора
const DEFAULT_POOLS = {
  ru: [
    'Бананы содержат много калия и витаминов, которые стимулируют работу мозга и улучшают концентрацию при скоростной печати на клавиатуре.',
    'Бананы — один из самых популярных фруктов в мире. Они богаты калием и дарят заряд бодрости на весь продуктивный рабочий день.',
    'Банановый коктейль перед утренней тренировкой заряжает энергией на весь рабочий день и поднимает настроение всей команде программистов.',
    'Если бы клавиатуры росли на пальмах рядом с бананами, каждый программист печатал бы со скоростью триста знаков в минуту без единой ошибки.',
    'Научно доказано, что спелый желтый банан повышает уровень серотонина, а быстрая и безошибочная печать вызывает настоящее чувство триумфа.',
    'Каждая строчка чистого кода приближает проект к совершенству. Внимание к деталям и хорошая архитектура делают систему устойчивой к любым нагрузкам.',
    'Регулярные тренировки слепого десятипальцевого метода позволяют печатать со скоростью мысли и значительно экономить время при работе с кодом.',
    'Опытный разработчик знает, что простота архитектуры важнее нагромождения сложных абстракций. Читаемый код спасает нервы всей команде.',
    'Современная веб-разработка сочетает в себе эстетику интерфейсов, реактивные компоненты и надежные базы данных для миллионов пользователей.',
    'В бескрайнем космосе сияют миллиарды далеких звезд, а космические телескопы ежедневно открывают удивительные тайны нашей Вселенной.',
    'Спокойствие и ритмичность движений — главный секрет высокой скорости печати. Пальцы должны легко скользить по клавишам без лишнего напряжения.',
    'Умение быстро формулировать свои мысли и мгновенно переносить их на экран — ключевой навык современного цифрового специалиста.',
    'Маленькие ежедневные победы складываются в колоссальный успех. Даже десять минут осознанной практики в день меняют качество работы навсегда.',
    'Концентрация внимания подобна мышце, которую можно и нужно тренировать. Избавься от лишнего шума и сфокусируйся на текущем моменте.',
    'Чашка ароматного горячего кофе ранним утром создает идеальное настроение для покорения новых творческих и профессиональных вершин.'
  ],
  en: [
    'Bananas are rich in potassium and nutrients that boost cognitive function and help maintain focus during intense typing sessions.',
    'Bananas are delicious, healthy, and packed with vitamins that keep your brain sharp during intense programming tasks.',
    'A fresh banana smoothie in the morning provides natural fuel for a productive day of building creative applications.',
    'Touch typing allows your fingers to move automatically while your mind stays fully focused on creating clean and elegant software.',
    'Modern web applications rely on responsive user interfaces, real-time reactive stores, and robust database architectures.',
    'Every line of well-structured code brings clarity to complex systems. Good architecture is the cornerstone of sustainable software engineering.',
    'Great software developers value simplicity and clarity over convoluted cleverness. Write code that your future self will thank you for.',
    'Deep learning models continue to transform how humans interact with technology, opening new frontiers in education and science.',
    'Maintaining a smooth, steady rhythm across the keyboard is more important than raw speed. Accuracy always leads to effortless typing velocity.',
    'Consistency turns small daily habits into extraordinary accomplishments. Keep your fingers active and enjoy every practice session.'
  ]
};

const getRandomFallbackText = (lang: 'ru' | 'en') => {
  const pool = DEFAULT_POOLS[lang];
  return pool[Math.floor(Math.random() * pool.length)];
};

interface TextState {
  currentText: string;
  currentTextId: number | null;
  currentTopic: string | null;
  currentDifficulty: string | null;
  currentSource: string | null;
  history: Text[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  fetchRandomText: (lang: 'ru' | 'en', excludeId?: number) => Promise<string>;
  generateAiText: (params: GenerateTextDto) => Promise<string>;
  fetchHistory: (lang?: 'ru' | 'en') => Promise<void>;
  selectTextFromHistory: (text: Text) => void;
  clearError: () => void;
}

export const useTextStore = create<TextState>((set, get) => ({
  currentText: '',
  currentTextId: null,
  currentTopic: null,
  currentDifficulty: null,
  currentSource: null,
  history: [],
  isLoading: true, // Сразу в состоянии загрузки, чтобы отображалась надпись «Текст уже придумывается...»
  isGenerating: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchRandomText: async (lang: 'ru' | 'en', excludeId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await textsControllerRandom({
        client,
        query: { 
          language: lang,
          ...(excludeId ? { excludeId } : {})
        },
      });

      if (response.error) {
        throw response.error;
      }

      const textData = response.data as Text;
      const textContent = (textData?.content || textData?.word || getRandomFallbackText(lang)).trim();

      set({
        currentText: textContent,
        currentTextId: textData?.id ? Number(textData.id) : null,
        currentTopic: textData?.topic ? String(textData.topic) : null,
        currentDifficulty: textData?.difficulty ? String(textData.difficulty) : null,
        currentSource: textData?.source ? String(textData.source) : 'database',
        isLoading: false,
      });

      return textContent;
    } catch (err: any) {
      console.warn('Не удалось загрузить случайный текст из базы данных, используем резервный пул:', err);
      const fallback = getRandomFallbackText(lang);
      set({
        currentText: fallback,
        currentTextId: null,
        currentTopic: null,
        currentDifficulty: null,
        currentSource: 'default',
        isLoading: false,
      });
      return fallback;
    }
  },

  generateAiText: async (params: GenerateTextDto) => {
    const lang = params.language || 'ru';
    set({ isGenerating: true, error: null });
    try {
      const response = await textsControllerGenerate({
        client,
        body: params,
      });

      if (response.error) {
        throw response.error;
      }

      const textData = response.data as Text;
      const textContent = (textData?.content || textData?.word || getRandomFallbackText(lang)).trim();

      set((state) => ({
        currentText: textContent,
        currentTextId: textData?.id ? Number(textData.id) : null,
        currentTopic: textData?.topic ? String(textData.topic) : params.topic || null,
        currentDifficulty: textData?.difficulty ? String(textData.difficulty) : params.difficulty || null,
        currentSource: textData?.source ? String(textData.source) : 'ai',
        history: textData?.id ? [textData, ...state.history.filter((h) => h.id !== textData.id)] : state.history,
        isGenerating: false,
      }));

      return textContent;
    } catch (err: any) {
      console.warn('Ошибка при генерации текста через ИИ, используем резервный пул текстов:', err);
      const fallback = getRandomFallbackText(lang);
      set({
        currentText: fallback,
        currentTextId: null,
        currentTopic: params.topic || null,
        currentDifficulty: params.difficulty || null,
        currentSource: 'ai-fallback',
        isGenerating: false,
        error: null,
      });
      return fallback;
    }
  },

  fetchHistory: async (lang?: 'ru' | 'en') => {
    try {
      const response = await textsControllerFindAll({
        client,
        query: lang ? { language: lang } : undefined,
      });

      if (response.data && Array.isArray(response.data)) {
        set({ history: response.data as Text[] });
      }
    } catch (err: any) {
      console.warn('Ошибка при получении истории текстов:', err);
    }
  },

  selectTextFromHistory: (item: Text) => {
    const content = (item.content || item.word || '').trim();
    if (content) {
      set({
        currentText: content,
        currentTextId: item.id ? Number(item.id) : null,
        currentTopic: item.topic ? String(item.topic) : null,
        currentDifficulty: item.difficulty ? String(item.difficulty) : null,
        currentSource: item.source ? String(item.source) : 'history',
      });
    }
  },
}));
