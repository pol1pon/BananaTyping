FROM node:22-alpine AS builder

WORKDIR /app

# Установка зависимостей для сборки sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Продакшен этап
FROM node:22-alpine AS runner

WORKDIR /app

# Установка зависимостей sqlite3 в продакшене
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Папка для файла SQLite базы данных
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV DB_DATABASE=/app/data/banana_typing.sqlite

CMD ["node", "dist/main.js"]
