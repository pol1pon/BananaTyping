import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Импортируем настроенный клиент API
import { client } from './api-client'; 

// Импортируем методы API, сгенерированные openapi-ts
import { 
  authControllerLogin, 
  authControllerRegister, 
  leaderboardsControllerFindByUserId 
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
}

export interface TypingResult {
  id: number;
  wpm: number;
  accuracy: number;
  duration_sec: number;
  createdAt: string;
  language?: 'ru' | 'en';
}

interface AuthState {
  // Состояние (State)
  currentUser: User | null;
  token: string | null;
  recentResults: TypingResult[];
  isLoading: boolean;
  error: string | null;

  // Действия (Actions)
  login: (credentials: AuthControllerLoginData['body']) => Promise<void>;
  register: (credentials: AuthControllerRegisterData['body']) => Promise<void>;
  logout: () => void;
  fetchUserResults: (userId: string | number) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      currentUser: null,
      token: null,
      recentResults: [],
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

          // Если клиент вернул ошибку (например, 401 или 400), выбрасываем её в блок catch
          if (response.error) {
            throw response.error;
          }

          const data = response.data as any; 
          const token = data?.accessToken; // Соответствует accessToken из NestJS бэкенда
          const user = data?.user;

          if (token) {
            client.setConfig({
              headers: { Authorization: `Bearer ${token}` }
            });
          }

          set({ currentUser: user, token, isLoading: false });
          
          // Если юзер успешно вошел, сразу подтягиваем его историю заездов
          if (user?.id) {
            await get().fetchUserResults(user.id);
          }
        } catch (err: any) {
          console.error('Ошибка при вызове authControllerLogin:', err);
          // Безопасно извлекаем текст ошибки, отправленный сервером
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

      // Выход из системы
      logout: () => {
        // Полностью очищаем заголовок авторизации в API-клиенте
        client.setConfig({
          headers: { Authorization: undefined }
        });
        // Сбрасываем стейт в исходное состояние
        set({ 
          currentUser: null, 
          token: null, 
          recentResults: [], 
          error: null 
        });
      },

      // Получение истории результатов авторизованного пользователя
      fetchUserResults: async (userId) => {
        try {
          const response = await leaderboardsControllerFindByUserId({
            path: { userId: String(userId) }
          });
          
          if (response.error) {
            throw response.error;
          }

          set({ recentResults: (response.data as unknown as TypingResult[]) || [] });
        } catch (err) {
          console.error("Не удалось загрузить результаты лидерборда:", err);
        }
      }
    }),
    {
      name: 'banana-typing-auth', // Уникальный ключ для localStorage
      // Сохраняем в localStorage только пользователя и токен, историю результатов будем запрашивать актуальную
      partialize: (state) => ({ 
        currentUser: state.currentUser, 
        token: state.token 
      }),
      // Метод срабатывает автоматически при первой загрузке приложения,
      // доставая токен из localStorage и прокидывая его обратно в настройки axios/fetch клиента
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