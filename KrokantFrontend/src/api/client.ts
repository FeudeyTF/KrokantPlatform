import { mockApi } from "./mockData";
import type {
  ApiError,
  DashboardSummary,
  LoginResponse,
  Task,
  TaskFilters,
  TaskListResponse,
  TaskStatus,
  User,
  WorkloadItem
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

let authToken = localStorage.getItem("krokant_token") ?? "";

export function setAuthToken(token: string) {
  authToken = token;
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
    if (USE_MOCKS) {
      return mockApi.login(email, password);
    }

    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  getTeachers(): Promise<User[]> {
    if (USE_MOCKS) {
      return mockApi.getTeachers();
    }

    return request<User[]>("/users?role=TEACHER");
  },

  getTasks(filters: TaskFilters): Promise<TaskListResponse> {
    if (USE_MOCKS) {
      return mockApi.getTasks(filters);
    }

    return request<TaskListResponse>(`/tasks${params(filters)}`);
  },

  getTask(id: string): Promise<Task> {
    if (USE_MOCKS) {
      return mockApi.getTask(id);
    }

    return request<Task>(`/tasks/${id}`);
  },

  createTask(data: {
    title: string;
    description: string;
    assigneeId: string;
    deadline: string;
  }): Promise<Task> {
    if (USE_MOCKS) {
      return mockApi.createTask(data);
    }

    return request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  updateTask(
    id: string,
    data: Partial<Pick<Task, "title" | "description" | "assigneeId" | "deadline">>
  ): Promise<Task> {
    if (USE_MOCKS) {
      return mockApi.updateTask(id, data);
    }

    return request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },

  changeStatus(id: string, status: TaskStatus) {
    if (USE_MOCKS) {
      return mockApi.changeStatus(id, status);
    }

    return request<{ id: string; status: TaskStatus; updatedAt: string }>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  },

  changeDeadline(id: string, deadline: string, comment: string) {
    if (USE_MOCKS) {
      return mockApi.changeDeadline(id, deadline);
    }

    return request<{ id: string; deadline: string; updatedAt: string }>(`/tasks/${id}/deadline`, {
      method: "PATCH",
      body: JSON.stringify({ deadline, comment })
    });
  },

  getSummary(): Promise<DashboardSummary> {
    if (USE_MOCKS) {
      return mockApi.getSummary();
    }

    return request<DashboardSummary>("/dashboard/summary");
  },

  getWorkload(): Promise<WorkloadItem[]> {
    if (USE_MOCKS) {
      return mockApi.getWorkload();
    }

    return request<WorkloadItem[]>("/dashboard/workload");
  }
};
