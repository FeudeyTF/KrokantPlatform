# Krokant Frontend

Простой frontend для сервиса мониторинга задач.

## Запуск

```bash
npm install
npm run dev
```

По умолчанию используются моковые данные.

Тестовые пользователи для моков:

- `head@uni.ru` / `123456` - руководитель
- `anna@uni.ru` / `123456` - преподаватель
- `oleg@uni.ru` / `123456` - преподаватель

## Переключение на backend

Создайте `.env`:

```env
VITE_USE_MOCKS=false
VITE_API_BASE_URL=/api/v1
```

Vite проксирует `/api` на `http://localhost:5000`. Если backend запущен на другом адресе, поменяйте `target` в `vite.config.ts` или укажите полный `VITE_API_BASE_URL`.
