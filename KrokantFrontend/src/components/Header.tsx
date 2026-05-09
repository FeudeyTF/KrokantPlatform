import { BarChart3, ClipboardList, LogOut, Plus } from "lucide-react";
import type { User } from "../types";

type Props = {
  user: User;
  page: string;
  onNavigate: (page: "dashboard" | "tasks" | "create") => void;
  onLogout: () => void;
};

export function Header({ user, page, onNavigate, onLogout }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <p className="muted small">Мониторинг задач</p>
        <h1>Krokant Platform</h1>
      </div>

      <nav className="nav">
        {user.role === "HEAD" && (
          <button
            className={page === "dashboard" ? "nav-button active" : "nav-button"}
            onClick={() => onNavigate("dashboard")}
            title="Сводка"
          >
            <BarChart3 size={16} />
            Dashboard
          </button>
        )}
        <button
          className={page === "tasks" ? "nav-button active" : "nav-button"}
          onClick={() => onNavigate("tasks")}
          title="Задачи"
        >
          <ClipboardList size={16} />
          Задачи
        </button>
        {user.role === "HEAD" && (
          <button
            className={page === "create" ? "nav-button active" : "nav-button"}
            onClick={() => onNavigate("create")}
            title="Создать задачу"
          >
            <Plus size={16} />
            Создать
          </button>
        )}
      </nav>

      <div className="user-box">
        <span>{user.fullName}</span>
        <strong>{user.role === "HEAD" ? "Руководитель" : "Преподаватель"}</strong>
        <button className="icon-button" onClick={onLogout} title="Выйти">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
