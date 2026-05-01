import type { Task, TaskStatus } from "../types";

export const statusLabels: Record<TaskStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Готово",
  OVERDUE: "Просрочена"
};

export function isOverdue(task: Pick<Task, "deadline" | "status">) {
  if (!task.deadline || task.status === "DONE") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(task.deadline);
  deadline.setHours(0, 0, 0, 0);

  return deadline < today;
}

export function visibleStatus(task: Task): TaskStatus {
  return isOverdue(task) ? "OVERDUE" : task.status;
}

export function nextStatuses(status: TaskStatus): TaskStatus[] {
  if (status === "NEW") {
    return ["NEW", "IN_PROGRESS"];
  }

  if (status === "IN_PROGRESS") {
    return ["IN_PROGRESS", "DONE"];
  }

  return [status];
}

export function formatDate(date: string) {
  if (!date) {
    return "Без срока";
  }

  return new Intl.DateTimeFormat("ru-RU").format(new Date(date));
}
