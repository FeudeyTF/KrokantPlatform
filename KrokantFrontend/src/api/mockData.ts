import type {
  Comment,
  DashboardSummary,
  LoginResponse,
  Priority,
  Task,
  TaskFilters,
  TaskListResponse,
  TaskStatus,
  User,
  WorkloadItem
} from "../types";
import { isOverdue } from "../utils/status";

const head: User = {
  id: "u1",
  fullName: "Иван Петров",
  email: "head@uni.ru",
  role: "HEAD"
};

const teachers: User[] = [
  { id: "t1", fullName: "Анна Сидорова", email: "anna@uni.ru", role: "TEACHER" },
  { id: "t2", fullName: "Олег Смирнов", email: "oleg@uni.ru", role: "TEACHER" },
  { id: "t3", fullName: "Мария Васильева", email: "maria@uni.ru", role: "TEACHER" }
];

let currentUser: User | null = null;

let tasks: Task[] = [
  {
    id: "task_1",
    title: "Организация практики",
    description: "Согласовать базу практики и подготовить список студентов для прохождения производственной практики в летнем семестре.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    deadline: "2026-05-10",
    assigneeId: "t1",
    assigneeName: "Анна Сидорова",
    createdById: "u1",
    createdByName: "Иван Петров",
    createdAt: "2026-04-16T10:00:00Z",
    updatedAt: "2026-04-22T12:00:00Z",
    comments: [
      {
        id: "c1",
        authorId: "u1",
        authorName: "Иван Петров",
        text: "Анна, пожалуйста, до конца недели пришлите список предприятий.",
        createdAt: "2026-04-18T09:30:00Z"
      },
      {
        id: "c2",
        authorId: "t1",
        authorName: "Анна Сидорова",
        text: "Список уже формирую, договорилась с тремя организациями. Отправлю в пятницу.",
        createdAt: "2026-04-18T14:10:00Z"
      }
    ],
    activity: [
      {
        id: "a1",
        actorName: "Иван Петров",
        action: "Задача создана",
        createdAt: "2026-04-16T10:00:00Z"
      },
      {
        id: "a2",
        actorName: "Анна Сидорова",
        action: "Статус изменён на «В работе»",
        createdAt: "2026-04-22T12:00:00Z"
      }
    ]
  },
  {
    id: "task_2",
    title: "Отчет по посещаемости",
    description: "Собрать таблицы по группам и отметить студентов с долгами по посещаемости за последний месяц.",
    status: "NEW",
    priority: "MEDIUM",
    deadline: "2026-05-06",
    assigneeId: "t2",
    assigneeName: "Олег Смирнов",
    createdById: "u1",
    createdByName: "Иван Петров",
    createdAt: "2026-04-20T09:10:00Z",
    updatedAt: "2026-04-20T09:10:00Z",
    comments: [
      {
        id: "c3",
        authorId: "t2",
        authorName: "Олег Смирнов",
        text: "Понял, начну собирать данные с понедельника.",
        createdAt: "2026-04-21T08:45:00Z"
      }
    ],
    activity: [
      {
        id: "a3",
        actorName: "Иван Петров",
        action: "Задача создана",
        createdAt: "2026-04-20T09:10:00Z"
      }
    ]
  },
  {
    id: "task_3",
    title: "Материалы к методсовету",
    description: "Обновить презентацию и приложить новые результаты опроса студентов за апрель.",
    status: "DONE",
    priority: "MEDIUM",
    deadline: "2026-04-28",
    assigneeId: "t1",
    assigneeName: "Анна Сидорова",
    createdById: "u1",
    createdByName: "Иван Петров",
    createdAt: "2026-04-12T13:00:00Z",
    updatedAt: "2026-04-25T16:40:00Z",
    comments: [
      {
        id: "c4",
        authorId: "t1",
        authorName: "Анна Сидорова",
        text: "Презентацию обновила, данные опроса добавила в приложение.",
        createdAt: "2026-04-25T16:00:00Z"
      },
      {
        id: "c5",
        authorId: "u1",
        authorName: "Иван Петров",
        text: "Отлично, принято!",
        createdAt: "2026-04-25T17:05:00Z"
      }
    ],
    activity: [
      {
        id: "a4",
        actorName: "Иван Петров",
        action: "Задача создана",
        createdAt: "2026-04-12T13:00:00Z"
      },
      {
        id: "a5",
        actorName: "Анна Сидорова",
        action: "Статус изменён на «В работе»",
        createdAt: "2026-04-20T10:15:00Z"
      },
      {
        id: "a6",
        actorName: "Анна Сидорова",
        action: "Статус изменён на «Готово»",
        createdAt: "2026-04-25T16:40:00Z"
      }
    ]
  },
  {
    id: "task_4",
    title: "Проверка рабочих программ",
    description: "Посмотреть программы дисциплин на соответствие ФГОС и отметить недочёты в сводной таблице.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    deadline: "2026-04-25",
    assigneeId: "t3",
    assigneeName: "Мария Васильева",
    createdById: "u1",
    createdByName: "Иван Петров",
    createdAt: "2026-04-10T08:30:00Z",
    updatedAt: "2026-04-26T11:20:00Z",
    comments: [],
    activity: [
      {
        id: "a7",
        actorName: "Иван Петров",
        action: "Задача создана",
        createdAt: "2026-04-10T08:30:00Z"
      },
      {
        id: "a8",
        actorName: "Мария Васильева",
        action: "Статус изменён на «В работе»",
        createdAt: "2026-04-14T09:00:00Z"
      },
      {
        id: "a9",
        actorName: "Иван Петров",
        action: "Дедлайн перенесён на 25.04.2026",
        createdAt: "2026-04-20T15:30:00Z"
      }
    ]
  },
  {
    id: "task_5",
    title: "Составление расписания экзаменов",
    description: "Сформировать расписание экзаменационной сессии и согласовать с деканатом.",
    status: "NEW",
    priority: "HIGH",
    deadline: "2026-05-15",
    assigneeId: "t2",
    assigneeName: "Олег Смирнов",
    createdById: "u1",
    createdByName: "Иван Петров",
    createdAt: "2026-05-01T11:00:00Z",
    updatedAt: "2026-05-01T11:00:00Z",
    comments: [],
    activity: [
      {
        id: "a10",
        actorName: "Иван Петров",
        action: "Задача создана",
        createdAt: "2026-05-01T11:00:00Z"
      }
    ]
  },
  {
    id: "task_6",
    title: "Обновление учебного плана",
    description: "Внести изменения в учебный план по направлению 09.03.01 с учётом новых требований.",
    status: "NEW",
    priority: "LOW",
    deadline: "2026-05-20",
    assigneeId: "t3",
    assigneeName: "Мария Васильева",
    createdById: "u1",
    createdByName: "Иван Петров",
    createdAt: "2026-05-02T09:00:00Z",
    updatedAt: "2026-05-02T09:00:00Z",
    comments: [],
    activity: [
      {
        id: "a11",
        actorName: "Иван Петров",
        action: "Задача создана",
        createdAt: "2026-05-02T09:00:00Z"
      }
    ]
  }
];

const priorityOrder: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function now() {
  return new Date().toISOString();
}

function uid() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function delay<T>(value: T) {
  return new Promise<T>((resolve) => window.setTimeout(() => resolve(value), 250));
}

function requireUser() {
  if (!currentUser) {
    const saved = localStorage.getItem("krokant_user");
    currentUser = saved ? JSON.parse(saved) : null;
  }

  if (!currentUser) {
    throw new Error("Пользователь не авторизован");
  }

  return currentUser;
}

function visibleTasks() {
  const user = requireUser();
  if (user.role === "TEACHER") {
    return tasks.filter((task) => task.assigneeId === user.id);
  }

  return tasks;
}

function findTeacher(id: string) {
  const teacher = teachers.find((item) => item.id === id);
  if (!teacher) {
    throw new Error("Преподаватель не найден");
  }

  return teacher;
}

function applySorting(list: Task[], sort?: TaskFilters["sort"]) {
  const sorted = [...list];

  if (sort === "priority") {
    sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  } else if (sort === "deadline_asc") {
    sorted.sort((a, b) => (a.deadline < b.deadline ? -1 : 1));
  } else if (sort === "deadline_desc") {
    sorted.sort((a, b) => (a.deadline > b.deadline ? -1 : 1));
  } else if (sort === "created") {
    sorted.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }

  return sorted;
}

export const mockApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const users = [head, ...teachers];
    const user = users.find((item) => item.email === email);

    if (!user || password !== "123456") {
      throw new Error("Неверный email или пароль");
    }

    currentUser = user;
    return delay({ accessToken: `mock-token-${user.id}`, user });
  },

  async getTeachers(): Promise<User[]> {
    requireUser();
    return delay(teachers);
  },

  async getTasks(filters: TaskFilters): Promise<TaskListResponse> {
    let filtered = [...visibleTasks()];

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.assigneeId) {
      filtered = filtered.filter((task) => task.assigneeId === filters.assigneeId);
    }

    if (filters.priority) {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          task.description.toLowerCase().includes(search)
      );
    }

    filtered = applySorting(filtered, filters.sort);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const start = (page - 1) * limit;

    return delay({
      items: filtered.slice(start, start + limit),
      page,
      limit,
      total: filtered.length
    });
  },

  async getTask(id: string): Promise<Task> {
    const task = visibleTasks().find((item) => item.id === id);
    if (!task) {
      throw new Error("Задача не найдена");
    }

    return delay({ ...task });
  },

  async createTask(data: {
    title: string;
    description: string;
    assigneeId: string;
    deadline: string;
    priority: Priority;
  }): Promise<Task> {
    const user = requireUser();
    if (user.role !== "HEAD") {
      throw new Error("Создавать задачи может только руководитель");
    }

    const teacher = findTeacher(data.assigneeId);
    const task: Task = {
      id: `task_${Date.now()}`,
      title: data.title,
      description: data.description,
      status: "NEW",
      priority: data.priority,
      deadline: data.deadline,
      assigneeId: teacher.id,
      assigneeName: teacher.fullName,
      createdById: user.id,
      createdByName: user.fullName,
      createdAt: now(),
      updatedAt: now(),
      comments: [],
      activity: [
        {
          id: uid(),
          actorName: user.fullName,
          action: "Задача создана",
          createdAt: now()
        }
      ]
    };

    tasks = [task, ...tasks];
    return delay(task);
  },

  async updateTask(
    id: string,
    data: Partial<Pick<Task, "title" | "description" | "assigneeId" | "deadline" | "priority">>
  ): Promise<Task> {
    const user = requireUser();
    if (user.role !== "HEAD") {
      throw new Error("Редактировать задачу может только руководитель");
    }

    const task = tasks.find((item) => item.id === id);
    if (!task) {
      throw new Error("Задача не найдена");
    }

    const changes: string[] = [];

    if (data.assigneeId && data.assigneeId !== task.assigneeId) {
      const teacher = findTeacher(data.assigneeId);
      task.assigneeId = teacher.id;
      task.assigneeName = teacher.fullName;
      changes.push(`Исполнитель изменён на «${teacher.fullName}»`);
    }

    if (data.priority && data.priority !== task.priority) {
      changes.push(`Приоритет изменён на «${data.priority}»`);
      task.priority = data.priority;
    }

    task.title = data.title ?? task.title;
    task.description = data.description ?? task.description;
    task.deadline = data.deadline ?? task.deadline;
    task.updatedAt = now();

    if (changes.length > 0) {
      task.activity.push({
        id: uid(),
        actorName: user.fullName,
        action: changes.join("; "),
        createdAt: now()
      });
    }

    return delay({ ...task });
  },

  async changeStatus(id: string, status: TaskStatus): Promise<{ id: string; status: TaskStatus; updatedAt: string }> {
    const user = requireUser();
    const task = visibleTasks().find((item) => item.id === id);
    if (!task) {
      throw new Error("Задача не найдена");
    }

    const statusNames: Record<TaskStatus, string> = {
      NEW: "Новая",
      IN_PROGRESS: "В работе",
      DONE: "Готово",
      OVERDUE: "Просрочена"
    };

    task.status = status;
    task.updatedAt = now();
    task.activity.push({
      id: uid(),
      actorName: user.fullName,
      action: `Статус изменён на «${statusNames[status]}»`,
      createdAt: now()
    });

    return delay({ id: task.id, status: task.status, updatedAt: task.updatedAt });
  },

  async changeDeadline(id: string, deadline: string, comment?: string): Promise<{ id: string; deadline: string; updatedAt: string }> {
    const user = requireUser();
    const task = visibleTasks().find((item) => item.id === id);
    if (!task) {
      throw new Error("Задача не найдена");
    }

    const formatted = new Intl.DateTimeFormat("ru-RU").format(new Date(deadline));
    task.deadline = deadline;
    task.updatedAt = now();
    task.activity.push({
      id: uid(),
      actorName: user.fullName,
      action: `Дедлайн перенесён на ${formatted}${comment ? ` — «${comment}»` : ""}`,
      createdAt: now()
    });

    return delay({ id: task.id, deadline: task.deadline, updatedAt: task.updatedAt });
  },

  async addComment(taskId: string, text: string): Promise<Comment> {
    const user = requireUser();
    const task = visibleTasks().find((item) => item.id === taskId);
    if (!task) {
      throw new Error("Задача не найдена");
    }

    const comment: Comment = {
      id: uid(),
      authorId: user.id,
      authorName: user.fullName,
      text,
      createdAt: now()
    };

    task.comments.push(comment);
    task.updatedAt = now();

    return delay(comment);
  },

  async getSummary(): Promise<DashboardSummary> {
    const all = visibleTasks();
    return delay({
      totalTasks: all.length,
      newTasks: all.filter((task) => task.status === "NEW").length,
      inProgressTasks: all.filter((task) => task.status === "IN_PROGRESS").length,
      doneTasks: all.filter((task) => task.status === "DONE").length,
      overdueTasks: all.filter(isOverdue).length
    });
  },

  async getWorkload(): Promise<WorkloadItem[]> {
    requireUser();
    return delay(
      teachers.map((teacher) => {
        const teacherTasks = tasks.filter((task) => task.assigneeId === teacher.id);
        return {
          teacherId: teacher.id,
          teacherName: teacher.fullName,
          new: teacherTasks.filter((task) => task.status === "NEW").length,
          inProgress: teacherTasks.filter((task) => task.status === "IN_PROGRESS").length,
          done: teacherTasks.filter((task) => task.status === "DONE").length,
          overdue: teacherTasks.filter(isOverdue).length
        };
      })
    );
  },

  async getUpcoming(days = 7): Promise<Task[]> {
    requireUser();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const upcoming = visibleTasks().filter((task) => {
      if (task.status === "DONE" || !task.deadline) return false;
      const d = new Date(task.deadline);
      d.setHours(0, 0, 0, 0);
      return d >= today && d <= limit;
    });

    upcoming.sort((a, b) => (a.deadline < b.deadline ? -1 : 1));
    return delay(upcoming.slice(0, 5));
  }
};
