export type UserRole = "HEAD" | "TEACHER";

export type TaskStatus = "NEW" | "IN_PROGRESS" | "DONE" | "OVERDUE";

export type User = {
  id: string;
  fullName: string;
  email?: string;
  role: UserRole;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string;
  assigneeId: string;
  assigneeName: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskListResponse = {
  items: Task[];
  page: number;
  limit: number;
  total: number;
};

export type DashboardSummary = {
  totalTasks: number;
  newTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
};

export type WorkloadItem = {
  teacherId: string;
  teacherName: string;
  new: number;
  inProgress: number;
  done: number;
  overdue: number;
};

export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type TaskFilters = {
  status?: string;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type ApiError = {
  error?: {
    code: string;
    message: string;
  };
};
