import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Импортируем настроенный клиент API
import { client } from './api-client'; 

// Импортируем методы API, сгенерированные openapi-ts
import { 
  authControllerLogin, 
  authControllerRegister, 
  leaderboardsControllerFindByUserId,
  usersControllerUpdate
} from '../../client/sdk.gen'; 

// Импортируем типы запросов из автогенерации
import type { 
  AuthControllerLoginData, 
  AuthControllerRegisterData 
} from '../../client/types.gen'; 

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  role?: 'user' | 'admin' | string;
  isPrivate?: boolean;
  createdAt?: string;
}

export interface TypingResult {
  id: number;
  wpm: number;
  accuracy: number;
  duration_sec: number;
  createdAt: string;
  language?: 'ru' | 'en';
  mode?: 'text' | 'time' | 'endless' | 'quick';
  characters?: number;
  errors?: number;
}

export interface SaveTypingResultPayload {
  wpm: number;
  accuracy: number;
  duration_sec: number;
  language?: 'ru' | 'en';
  mode?: 'text' | 'time' | 'endless' | 'quick';
  characters?: number;
  errors?: number;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  password?: string;
  isPrivate?: boolean;
}

interface AuthState {
  // Состояние (State)
  currentUser: User | null;
  token: string | null;
  recentResults: TypingResult[];
  guestResults: TypingResult[];
  resultsLoading: boolean;
  isLoading: boolean;
  error: string | null;

  // Действия (Actions)
  login: (credentials: AuthControllerLoginData['body']) => Promise<void>;
  register: (credentials: AuthControllerRegisterData['body']) => Promise<void>;
  logout: () => void;
  fetchUserResults: (userId: string | number) => Promise<void>;
  saveTypingResult: (payload: SaveTypingResultPayload) => Promise<TypingResult | null>;
  fetchCurrentUser: () => Promise<void>;
  updateProfile: (data: UpdateProfilePayload) => Promise<User>;
  claimAdmin: (secretKey: string) => Promise<User>;
  clearError: () => void;
}

function sortResultsChronologically(items: TypingResult[]): TypingResult[] {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    return Number(a.id) - Number(b.id);
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      currentUser: null,
      token: null,
      recentResults: [],
      guestResults: [],
      resultsLoading: false,
      isLoading: false,
      error: null,

      // Сброс ошибок в интерфейсе
      clearError: () => set({ error: null }),

      // Авторизация пользователя
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authControllerLogin({
            body: credentials
          });

          if (response.error) {
            throw response.error;
          }

          const data = response.data as any; 
          const token = data?.accessToken; 
          const user = data?.user;

          if (token) {
            client.setConfig({
              headers: { Authorization: `Bearer ${token}` }
            });
          }

          set({ currentUser: user, token, isLoading: false });
          
          if (user?.id) {
            await get().fetchUserResults(user.id);
          }
        } catch (err: any) {
          console.error('Ошибка при вызове authControllerLogin:', err);
          const errorMessage = err?.message || err?.response?.data?.message || 'Неверный email или пароль';
          set({ isLoading: false, error: errorMessage });
          throw err;
        }
      },

      // Регистрация нового пользователя
      register: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authControllerRegister({
            body: credentials
          });
          
          if (response.error) {
            throw response.error;
          }

          const data = response.data as any; 
          const token = data?.accessToken; 
          const user = data?.user;
        
          if (token) {
            client.setConfig({
              headers: { Authorization: `Bearer ${token}` }
            });
          }

          set({ currentUser: user, token, isLoading: false });
        } catch (err: any) {
          console.error('Ошибка при вызове authControllerRegister:', err);
          const errorMessage = err?.message || err?.response?.data?.message || 'Ошибка регистрации. Возможно, этот email уже занят.';
          set({ isLoading: false, error: errorMessage });
          throw err;
        }
      },

      // Обновление профиля текущего пользователя
      updateProfile: async (data) => {
        const { currentUser } = get();
        if (!currentUser?.id) {
          throw new Error('Пользователь не авторизован');
        }

        set({ isLoading: true, error: null });
        try {
          const response = await usersControllerUpdate({
            path: { id: String(currentUser.id) },
            body: data
          });

          if (response.error) {
            throw response.error;
          }

          const updatedUser = response.data as unknown as User;
          set({ currentUser: updatedUser, isLoading: false });
          return updatedUser;
        } catch (err: any) {
          console.error('Ошибка при обновлении профиля:', err);
          const rawMsg = err?.message || err?.response?.data?.message || 'Не удалось обновить профиль';
          const errorMessage = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg);
          set({ isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // Получение прав администратора по секретному ключу / ссылке
      claimAdmin: async (secretKey: string) => {
        const { currentUser } = get();
        if (!currentUser?.id) {
          throw new Error('Для активации прав администратора войдите в аккаунт');
        }

        set({ isLoading: true, error: null });
        try {
          const response = await client.post<{ data: User }>({
            url: '/users/claim-admin',
            body: {
              userId: currentUser.id,
              secretKey: secretKey.trim(),
            },
          });

          if (response.error) {
            throw response.error;
          }

          const updatedUser = (response.data as unknown as User) || { ...currentUser, role: 'admin' };
          set({ currentUser: updatedUser, isLoading: false });
          return updatedUser;
        } catch (err: any) {
          console.error('Ошибка при активации прав администратора:', err);
          const rawMsg = err?.message || err?.response?.data?.message || 'Неверный секретный ключ администратора';
          const errorMessage = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg);
          set({ isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // Загрузка свежих данных текущего пользователя
      fetchCurrentUser: async () => {
        const { currentUser } = get();
        if (!currentUser?.id) return;

        try {
          const response = await client.get<User>({
            url: `/users/${currentUser.id}`,
          });
          if (response.data) {
            set({ currentUser: response.data as User });
          }
        } catch (err) {
          console.error('Не удалось обновить данные пользователя:', err);
        }
      },

      // Выход из системы
      logout: () => {
        client.setConfig({
          headers: { Authorization: undefined }
        });
        set({ 
          currentUser: null, 
          token: null, 
          recentResults: [], 
          error: null 
        });
      },

      // Получение истории результатов авторизованного пользователя
      fetchUserResults: async (userId) => {
        set({ resultsLoading: true });
        try {
          const response = await leaderboardsControllerFindByUserId({
            path: { userId: String(userId) }
          });
          
          if (response.error) {
            throw response.error;
          }

          const sorted = sortResultsChronologically((response.data as unknown as TypingResult[]) || []);
          set({ recentResults: sorted, resultsLoading: false });
        } catch (err) {
          console.error("Не удалось загрузить результаты лидерборда:", err);
          set({ resultsLoading: false });
        }
      },

      // Сохранение нового результата тренировки (в БД для авторизованных или локально для гостя)
      saveTypingResult: async (payload) => {
        if (!payload || payload.wpm <= 0) return null;

        const { currentUser, recentResults, guestResults } = get();

        if (currentUser?.id) {
          try {
            const response = await client.post<TypingResult>({
              url: '/leaderboards',
              body: {
                userId: Number(currentUser.id),
                wpm: Math.round(payload.wpm),
                accuracy: Math.round(payload.accuracy),
                duration_sec: Math.max(1, Math.round(payload.duration_sec)),
                ...(payload.language ? { language: payload.language } : {}),
                ...(payload.mode ? { mode: payload.mode } : {}),
                ...(payload.characters !== undefined ? { characters: Math.round(payload.characters) } : {}),
                ...(payload.errors !== undefined ? { errors: Math.round(payload.errors) } : {}),
              },
            });

            if (response.error) {
              throw response.error;
            }

            const created = response.data as unknown as TypingResult;
            if (created) {
              set({ recentResults: sortResultsChronologically([...recentResults, created]) });
              return created;
            }
            await get().fetchUserResults(currentUser.id);
            return null;
          } catch (err) {
            console.error('Ошибка сохранения результата в БД:', err);
            return null;
          }
        } else {
          const localEntry: TypingResult = {
            id: Date.now(),
            wpm: Math.round(payload.wpm),
            accuracy: Math.round(payload.accuracy),
            duration_sec: Math.max(1, Math.round(payload.duration_sec)),
            createdAt: new Date().toISOString(),
            language: payload.language,
            mode: payload.mode,
            characters: payload.characters,
            errors: payload.errors,
          };
          const updated = [...guestResults, localEntry].slice(-50);
          set({ guestResults: updated });
          return localEntry;
        }
      }
    }),
    {
      name: 'banana-typing-auth',
      partialize: (state) => ({ 
        currentUser: state.currentUser, 
        token: state.token,
        guestResults: state.guestResults,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          client.setConfig({
            headers: { Authorization: `Bearer ${state.token}` }
          });
        }
      }
    }
  )
);
