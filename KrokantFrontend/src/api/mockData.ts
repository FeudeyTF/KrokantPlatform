import type {
  DashboardSummary,
  LoginResponse,
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
    description: "Согласовать базу практики и подготовить список студентов.",
    status: "IN_PROGRESS",
    deadline: "2026-05-10",
    assigneeId: "t1",
    assigneeName: "Анна Сидорова",
    createdById: "u1",
    createdByName: "Иван Петров",
    createdAt: "2026-04-16T10:00:00Z",
    updatedAt: "2026-04-16T12:00:00Z"
  },
  {
    id: "task_2",
    title: "Отчет по посещаемости",
    description: "Собрать таблицы по группам и отметить студентов с долгами.",
    status: "NEW",
    deadline: "2026-05-06",
    assigneeId: "t2",
    assigneeName: "Олег Смирнов",
    createdById: "u1",
    createdByName: "Иван Петров",
    createdAt: "2026-04-20T09:10:00Z",
    updatedAt: "2026-04-20T09:10:00Z"
  },
  {
    id: "task_3",
    title: "Материалы к методсовету",
    description: "Обновить презентацию и приложить новые результаты.",
    status: "DONE",
    deadline: "2026-04-28",
    assigneeId: "t1",
    assigneeName: "Анна Сидорова",
    createdById: "u1",
    createdByName: "Иван Петров",
    createdAt: "2026-04-12T13:00:00Z",
    updatedAt: "2026-04-25T16:40:00Z"
  },
  {
    id: "task_4",
    title: "Проверка рабочих программ",
    description: "Посмотреть программы дисциплин и отметить недочеты.",
    status: "IN_PROGRESS",
    deadline: "2026-04-25",
    assigneeId: "t3",
    assigneeName: "Мария Васильева",
    createdById: "u1",
    createdByName: "Иван Петров",
    createdAt: "2026-04-10T08:30:00Z",
    updatedAt: "2026-04-26T11:20:00Z"
  }
];

function now() {
  return new Date().toISOString();
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

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          task.description.toLowerCase().includes(search)
      );
    }

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

    return delay(task);
  },

  async createTask(data: {
    title: string;
    description: string;
    assigneeId: string;
    deadline: string;
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
      deadline: data.deadline,
      assigneeId: teacher.id,
      assigneeName: teacher.fullName,
      createdById: user.id,
      createdByName: user.fullName,
      createdAt: now(),
      updatedAt: now()
    };

    tasks = [task, ...tasks];
    return delay(task);
  },

  async updateTask(
    id: string,
    data: Partial<Pick<Task, "title" | "description" | "assigneeId" | "deadline">>
  ): Promise<Task> {
    const user = requireUser();
    if (user.role !== "HEAD") {
      throw new Error("Редактировать задачу может только руководитель");
    }

    const task = tasks.find((item) => item.id === id);
    if (!task) {
      throw new Error("Задача не найдена");
    }

    if (data.assigneeId) {
      const teacher = findTeacher(data.assigneeId);
      task.assigneeId = teacher.id;
      task.assigneeName = teacher.fullName;
    }

    task.title = data.title ?? task.title;
    task.description = data.description ?? task.description;
    task.deadline = data.deadline ?? task.deadline;
    task.updatedAt = now();

    return delay(task);
  },

  async changeStatus(id: string, status: TaskStatus): Promise<{ id: string; status: TaskStatus; updatedAt: string }> {
    const task = visibleTasks().find((item) => item.id === id);
    if (!task) {
      throw new Error("Задача не найдена");
    }

    task.status = status;
    task.updatedAt = now();
    return delay({ id: task.id, status: task.status, updatedAt: task.updatedAt });
  },

  async changeDeadline(id: string, deadline: string): Promise<{ id: string; deadline: string; updatedAt: string }> {
    const task = visibleTasks().find((item) => item.id === id);
    if (!task) {
      throw new Error("Задача не найдена");
    }

    task.deadline = deadline;
    task.updatedAt = now();
    return delay({ id: task.id, deadline: task.deadline, updatedAt: task.updatedAt });
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
  }
};
