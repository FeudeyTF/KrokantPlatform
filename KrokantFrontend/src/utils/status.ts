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
  if (status === "NEW") return ["NEW", "IN_PROGRESS"];
  if (status === "IN_PROGRESS") return ["IN_PROGRESS", "DONE"];
  return [status];
}

export function formatDate(date: string) {
  if (!date) return "Без срока";
  return new Intl.DateTimeFormat("ru-RU").format(new Date(date));
}

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(dateStr);
  if (days > 0) return `${days} дн. назад`;
  if (hours > 0) return `${hours} ч. назад`;
  if (mins > 0) return `${mins} мин. назад`;
  return "только что";
}

export function taskProgress(status: TaskStatus) {
  if (status === "DONE") return 100;
  if (status === "IN_PROGRESS") return 55;
  if (status === "OVERDUE") return 25;
  return 12;
}

export function daysUntilDeadline(date: string) {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(date);
  deadline.setHours(0, 0, 0, 0);

  const msInDay = 24 * 60 * 60 * 1000;
  return Math.ceil((deadline.getTime() - today.getTime()) / msInDay);
}

export function deadlineProgress(date: string, status: TaskStatus) {
  if (status === "DONE") return 100;

  const daysLeft = daysUntilDeadline(date);
  if (daysLeft === null) return 0;
  if (daysLeft <= 0) return 100;

  const period = 30;
  return Math.min(95, Math.max(8, Math.round(((period - daysLeft) / period) * 100)));
}
