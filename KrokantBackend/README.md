# KrokantBackend - Backend-сервер

## Краткое описание

ASP.NET Core Web API для управления образовательными задачами. Использует SQLite через Entity Framework Core, аутентификацию на базе JWT, Swagger для документации и Serilog для логирования.

## Требования

- .NET 9 SDK

## Установка и запуск

```bash
cd KrokantBackend
dotnet restore
dotnet build
dotnet run
```

После запуска API доступно по умолчанию по адресам:
- https://localhost:5001
- http://localhost:5000

Базовый префикс API: /api/v1

## Конфигурация

- Параметры находятся в appsettings.json. Важные ключи:
  - Jwt:Key - секрет для подписи токенов
  - Jwt:Issuer, Jwt:Audience - при необходимости
- Переопределение настроек возможно через переменные окружения (например, Jwt_Key).

## База данных

- Используется SQLite (Data Source=data.sqlite). Файл создаётся автоматически в директории приложения.
- Контекст БД автоматически создаётся при старте (EnsureCreated).

## Предопределённые учётные записи (только для разработки)

- Руководитель (HEAD): head@spbstu.ru / 123456
- Преподаватель (TEACHER): anna@spbstu.ru / pass1
- Преподаватель (TEACHER): oleg@spbstu.ru / pass2

## Swagger

- Swagger UI доступен в режиме разработки по /swagger (включается автоматически для среды Development).

## Аутентификация

- JWT Bearer. Получить токен: POST /api/v1/auth/login (email + password). Передавать заголовок Authorization: Bearer <token>.
- Роли: HEAD (руководитель) и TEACHER (преподаватель).

## API

1) Аутентификация
- POST /api/v1/auth/login
  - Body: { "email": "...", "password": "..." }
  - Ответ: { accessToken, user: { id, fullName, email, role } }

2) Дашборд (только для HEAD)
- GET /api/v1/dashboard/summary - сводка: totalTasks, newTasks, inProgressTasks, doneTasks, overdueTasks
- GET /api/v1/dashboard/workload - загрузка по преподавателям (teacherId, teacherName, new, inProgress, done, overdue)

3) Управление задачами
- POST /api/v1/tasks (ROLE: HEAD)
  - Body: { Title, Description, AssigneeId, Deadline (YYYY-MM-DD), Priority (LOW|MEDIUM|HIGH) }
  - Создаёт задачу, возвращает созданный объект

- GET /api/v1/tasks (AUTH)
  - Query params: status, assigneeId, search, priority, sort (deadline_asc|deadline_desc|priority|created), page, limit
  - Ответ: { items, page, limit, total }

- GET /api/v1/tasks/upcoming?days=7 (AUTH)
  - Возвращает задачи с дедлайнами в пределах указанных дней

- GET /api/v1/tasks/{id} (AUTH)
  - Возвращает полную информацию о задаче, включая comments и activity

- PATCH /api/v1/tasks/{id} (ROLE: HEAD)
  - Body: { Title?, Description?, AssigneeId?, Deadline?, Priority? }
  - Обновляет поля задачи

- PATCH /api/v1/tasks/{id}/status (AUTH)
  - Body: { Status } (NEW|IN_PROGRESS|DONE|OVERDUE)
  - Изменяет статус (проверяются корректные переходы)

- PATCH /api/v1/tasks/{id}/deadline (AUTH)
  - Body: { Deadline (YYYY-MM-DD), Comment? }
  - Позволяет изменить дедлайн (исполнитель или HEAD)

- POST /api/v1/tasks/{id}/comments (AUTH)
  - Body: { Text }
  - Добавляет комментарий к задаче

4) Пользователи
- GET /api/v1/users?role=TEACHER (AUTH)
  - Возвращает список пользователей (id, fullName, role)

## Модели

- User: { id, fullName, email, password, role }
- TaskItem: { id, title, description, status (NEW|IN_PROGRESS|DONE|OVERDUE), priority (LOW|MEDIUM|HIGH), deadline, assignee, createdBy, comments, activities, createdAt, updatedAt }
- TaskComment: { id, taskId, authorId, authorName, text, createdAt }
- TaskActivity: { id, taskId, actorName, action, createdAt }

## Логирование

- Serilog -> консоль. Конфигурация в Program.cs.
