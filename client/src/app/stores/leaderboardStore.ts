import { create } from 'zustand';
import { client } from './api-client';

// ВАЖНО: Проверь точное имя метода в твоем sdk.gen.ts. 
// Обычно для получения всех записей он называется leaderboardsControllerFindAll
import { leaderboardsControllerFindAll } from '../../client/sdk.gen';

export interface LeaderboardEntry {
  id: number;
  wpm: number;
  accuracy: number;
  duration_sec: number;
  createdAt: string;
  language?: 'ru' | 'en';
  user?: {
    id: number;
    username: string;
    avatar?: string;
    role?: string;
    isPrivate?: boolean;
  };
}

interface LeaderboardState {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;

  fetchLeaderboard: (period?: 'daily' | 'all') => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchLeaderboard: async (period?: 'daily' | 'all') => {
    set({ isLoading: true, error: null });
    try {
      const response = await leaderboardsControllerFindAll({
        client,
        query: period ? { period } : undefined,
      });

      if (response.error) {
        throw response.error;
      }

      let data = (response.data as unknown as LeaderboardEntry[]) || [];
      data.sort((a, b) => b.wpm - a.wpm);

      const topPlayers = data.slice(0, 100);

      set({ entries: topPlayers, isLoading: false });
    } catch (err: any) {
      console.error('Ошибка при загрузке лидерборда:', err);
      const errorMessage = err?.message || err?.response?.data?.message || 'Не удалось загрузить таблицу лидеров';
      set({ isLoading: false, error: errorMessage });
    }
  },
}));