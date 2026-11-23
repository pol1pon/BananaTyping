import { create } from 'zustand';
import { client } from './api-client';
import { 
  textsControllerRandom, 
  textsControllerGenerate, 
  textsControllerFindAll 
} from '../../client/sdk.gen';
import type { Text, GenerateTextDto } from '../../client/types.gen';

// Запасные тексты по умолчанию на случай, если бэкенд не запущен
const DEFAULT_TEXTS = {
  ru: 'Скоропечатание развивает моторику и улучшает память. Регулярные тренировки помогают достигать высоких результатов в работе и учебе.',
  en: 'Typing fast improves motor skills and enhances memory. Regular practice helps achieve high results in work and studies.',
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

  fetchRandomText: (lang: 'ru' | 'en') => Promise<string>;
  generateAiText: (params: GenerateTextDto) => Promise<string>;
  fetchHistory: (lang?: 'ru' | 'en') => Promise<void>;
  selectTextFromHistory: (text: Text) => void;
  clearError: () => void;
}

export const useTextStore = create<TextState>((set, get) => ({
  currentText: DEFAULT_TEXTS.ru,
  currentTextId: null,
  currentTopic: null,
  currentDifficulty: null,
  currentSource: null,
  history: [],
  isLoading: false,
  isGenerating: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchRandomText: async (lang: 'ru' | 'en') => {
    set({ isLoading: true, error: null });
    try {
      const response = await textsControllerRandom({
        client,
        query: { language: lang },
      });

      if (response.error) {
        throw response.error;
      }

      const textData = response.data as Text;
      const textContent = (textData?.content || textData?.word || DEFAULT_TEXTS[lang]).trim();

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
      console.warn('Не удалось загрузить случайный текст из БД, используем резервный:', err);
      const fallback = DEFAULT_TEXTS[lang];
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
      const textContent = (textData?.content || textData?.word || DEFAULT_TEXTS[lang]).trim();

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
      console.error('Ошибка при генерации текста через ИИ:', err);
      const errorMsg = err?.message || 'Не удалось сгенерировать текст. Проверьте соединение с сервером.';
      set({ isGenerating: false, error: errorMsg });
      throw err;
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
