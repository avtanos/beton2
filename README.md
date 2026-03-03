# beton2

EIS «Түндүк-Бетон» — производственно-логистический комплекс. React + Node.js с мок-ап данными.

## Структура проекта

```
beton2/
├── client/          # React SPA
├── server/          # Express API
├── data/            # Mock-up данные (JSON)
└── package.json
```

## Запуск

### 1. Установка зависимостей

```bash
npm run install:all
```

### 2. Настройка окружения (опционально)

```bash
cp client/.env.example client/.env
```

По умолчанию `REACT_APP_API=http://localhost:3001`.

### 3. Запуск в режиме разработки

```bash
npm run dev
```

- API: http://localhost:3001
- Клиент: http://localhost:3000

### 4. Или по отдельности

```bash
# Терминал 1
npm run server

# Терминал 2
npm run client
```

## Mock-up данные

Данные хранятся в папке `data/` в виде JSON-файлов. Сервер читает и записывает их напрямую (без БД).

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run server` | Запуск API |
| `npm run client` | Запуск React-приложения |
| `npm run dev` | Запуск сервера и клиента одновременно |
| `npm run install:all` | Установка зависимостей в корне и client |
