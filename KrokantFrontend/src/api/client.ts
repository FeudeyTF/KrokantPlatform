import { mockApi } from "./mockData";
import type {
  ActivityEntry,
  ApiError,
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

let authToken = localStorage.getItem("krokant_token") ?? "";

export function setAuthToken(token: string) {
  authToken = token;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "NEW" || value === "IN_PROGRESS" || value === "DONE" || value === "OVERDUE";
}

function isPriority(value: unknown): value is Priority {
  return value === "HIGH" || value === "MEDIUM" || value === "LOW";
}

function normalizeTask(input: unknown): Task {
  const task = asRecord(input);

  if (!task) {
    throw new Error("Некорректный формат задачи в ответе сервера");
  }

  return {
    id: asString(task.id),
    title: asString(task.title),
    description: asString(task.description),
    status: isTaskStatus(task.status) ? task.status : "NEW",
    priority: isPriority(task.priority) ? task.priority : "MEDIUM",
    deadline: asString(task.deadline),
    assigneeId: asString(task.assigneeId),
    assigneeName: asString(task.assigneeName),
    createdById: asString(task.createdById),
    createdByName: asString(task.createdByName),
    createdAt: asString(task.createdAt),
    updatedAt: asString(task.updatedAt),
    comments: asArray<Comment>(task.comments),
    activity: asArray<ActivityEntry>(task.activity)
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    let message = "Ошибка запроса";

    try {
      const data = (await response.json()) as ApiError;
      message = data.error?.message ?? message;
    } catch {
      message = `${response.status} ${response.statusText}`;
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function params(filters: TaskFilters) {
  const result = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      result.set(key, String(value));
    }
  });

  const query = result.toString();
  return query ? `?${query}` : "";
}

export const api = {
  login(email: string, password: string): Promise<LoginResponse> {
    if (USE_MOCKS) return mockApi.login(email, password);
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  getTeachers(): Promise<User[]> {
    if (USE_MOCKS) return mockApi.getTeachers();
    return request<User[]>("/users?role=TEACHER");
  },

  getTasks(filters: TaskFilters): Promise<TaskListResponse> {
    if (USE_MOCKS) return mockApi.getTasks(filters);
    return request<TaskListResponse>(`/tasks${params(filters)}`).then((data) => ({
      page: asNumber(data.page, 1),
      limit: asNumber(data.limit, 20),
      total: asNumber(data.total),
      items: asArray<unknown>(data.items).map(normalizeTask)
    }));
  },

  getTask(id: string): Promise<Task> {
    if (USE_MOCKS) return mockApi.getTask(id);
    return request<Task>(`/tasks/${id}`).then(normalizeTask);
  },

  createTask(data: {
    title: string;
    description: string;
    assigneeId: string;
    deadline: string;
    priority: Priority;
  }): Promise<Task> {
    if (USE_MOCKS) return mockApi.createTask(data);
    return request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data)
    }).then(normalizeTask);
  },

  updateTask(
    id: string,
    data: Partial<Pick<Task, "title" | "description" | "assigneeId" | "deadline" | "priority">>
  ): Promise<Task> {
    if (USE_MOCKS) return mockApi.updateTask(id, data);
    return request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }).then(normalizeTask);
  },

  changeStatus(id: string, status: TaskStatus) {
    if (USE_MOCKS) return mockApi.changeStatus(id, status);
    return request<{ id: string; status: TaskStatus; updatedAt: string }>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  },

  changeDeadline(id: string, deadline: string, comment: string) {
    if (USE_MOCKS) return mockApi.changeDeadline(id, deadline, comment);
    return request<{ id: string; deadline: string; updatedAt: string }>(`/tasks/${id}/deadline`, {
      method: "PATCH",
      body: JSON.stringify({ deadline, comment })
    });
  },

  addComment(taskId: string, text: string): Promise<Comment> {
    if (USE_MOCKS) return mockApi.addComment(taskId, text);
    return request<Comment>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
  },

  getSummary(): Promise<DashboardSummary> {
    if (USE_MOCKS) return mockApi.getSummary();
    return request<DashboardSummary>("/dashboard/summary");
  },

  getWorkload(): Promise<WorkloadItem[]> {
    if (USE_MOCKS) return mockApi.getWorkload();
    return request<WorkloadItem[]>("/dashboard/workload");
  },

  getUpcoming(days = 7): Promise<Task[]> {
    if (USE_MOCKS) return mockApi.getUpcoming(days);
    return request<Task[]>(`/tasks/upcoming?days=${days}`).then((tasks) =>
      asArray<unknown>(tasks).map(normalizeTask)
    );
  }
};
