import { client } from '../../client/client.gen';

// Базовый URL API: в продакшене берется из переменной окружения VITE_API_URL, локально — localhost:3000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

client.setConfig({
  baseUrl: API_URL,
  credentials: 'include',
});

export { client };