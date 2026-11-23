import { client } from '../../client/client.gen';

// Базовый URL API:
// 1. Если явно задана переменная окружения VITE_API_URL, используем её
// 2. В режиме локальной разработки (Vite dev) используем http://localhost:3000
// 3. В продакшене (на сервере/домене) оставляем пустую строку '', чтобы запросы шли относительно текущего хоста (через Nginx прокси)
const API_URL =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.DEV ? 'http://localhost:3000' : '');

client.setConfig({
  baseUrl: API_URL,
  credentials: 'include',
});

export { client };
