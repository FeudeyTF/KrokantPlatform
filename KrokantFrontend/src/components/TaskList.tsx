import { FormEvent, useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { api } from "../api/client";
import type { Priority, Task, TaskFilters, User } from "../types";
import {
    daysUntilDeadline,
    formatDate,
    statusLabels,
    visibleStatus
} from "../utils/status";

type Props = {
    currentUser: User;
    refreshKey: number;
    onSelectTask: (id: string) => void;
};

const priorityLabel: Record<Priority, string> = {
  HIGH: "Высокий",
  MEDIUM: "Средний",
  LOW: "Низкий"
};

const sortOptions = [
  { value: "", label: "По умолчанию" },
  { value: "priority", label: "По приоритету" },
  { value: "deadline_asc", label: "Дедлайн ↑" },
  { value: "deadline_desc", label: "Дедлайн ↓" },
  { value: "created", label: "Дата создания" }
];

export function TaskList({ currentUser, refreshKey, onSelectTask }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState<TaskFilters["sort"] | "">("");
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [taskData, teacherData] = await Promise.all([
        api.getTasks({
          search,
          status,
          assigneeId,
          priority,
          sort: sort as TaskFilters["sort"],
          page: 1,
          limit: 20
        }),
        currentUser.role === "HEAD" ? api.getTeachers() : Promise.resolve([])
      ]);

      setTasks(taskData.items);
      setTotal(taskData.total);
      setTeachers(teacherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки задач");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [refreshKey]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  function reset() {
    setSearch("");
    setStatus("");
    setAssigneeId("");
    setPriority("");
    setSort("");
    setTimeout(() => void load(), 0);
  }

  const hasFilters = search || status || assigneeId || priority || sort;

  return (
    <section className="page-section">
      <div className="section-title">
        <div>
          <p className="muted small">Всего найдено: {total}</p>
          <h2>Задачи</h2>
        </div>
      </div>

      <form className="filters" onSubmit={submit}>
        <label className="filter-search">
          Поиск
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Название или описание..."
          />
        </label>

        <label>
          Статус
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Все статусы</option>
            <option value="NEW">Новые</option>
            <option value="IN_PROGRESS">В работе</option>
            <option value="DONE">Готово</option>
          </select>
        </label>

        <label>
          Приоритет
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Любой</option>
            <option value="HIGH">🔴 Высокий</option>
            <option value="MEDIUM">🟡 Средний</option>
            <option value="LOW">🟢 Низкий</option>
          </select>
        </label>

        {currentUser.role === "HEAD" && (
          <label>
            Исполнитель
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Все</option>
              {teachers.map((t) => (
                <option value={t.id} key={t.id}>{t.fullName}</option>
              ))}
            </select>
          </label>
        )}

        <label>
          Сортировка
          <select value={sort} onChange={(e) => setSort(e.target.value as TaskFilters["sort"])}>
            {sortOptions.map((o) => (
              <option value={o.value} key={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <div className="filter-actions">
          <button className="secondary" type="submit">
            <Search size={15} />
            Найти
          </button>
          {hasFilters && (
            <button className="plain-link" type="button" onClick={reset}>
              Сбросить
            </button>
          )}
        </div>
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Загрузка...</p>}

      <div className="task-grid">
        {tasks.map((task) => {
          const statusView = visibleStatus(task);
          const daysLeft = daysUntilDeadline(task.deadline);
          const deadlinePercent = deadlineProgress(task.deadline, statusView);
          const workPercent = taskProgress(statusView);

          return (
            <button className="task-card" key={task.id} onClick={() => onSelectTask(task.id)}>
              <div className="task-card-top">
                <span className={`badge ${statusView.toLowerCase()}`}>
                  {statusLabels[statusView]}
                </span>
                <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                  {priorityLabel[task.priority]}
                </span>
              </div>

              <h3>{task.title}</h3>
              <p>{task.description}</p>

              <div className="task-progress">
                <div className="task-progress-row">
                  <span>Выполнение</span>
                  <b>{workPercent}%</b>
                </div>
                <div className="progress-track">
                  <div className="progress-fill progress" style={{ width: `${workPercent}%` }} />
                </div>
                <div className="task-progress-row">
                  <span>Срок</span>
                  <b>
                    {daysLeft === null
                      ? "нет"
                      : daysLeft < 0
                        ? `${Math.abs(daysLeft)} дн. проср.`
                        : `${daysLeft} дн.`}
                  </b>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${statusView === "OVERDUE" ? "danger" : "deadline"}`}
                    style={{ width: `${deadlinePercent}%` }}
                  />
                </div>
              </div>

              <div className="task-meta">
                <span>{task.assigneeName}</span>
                <span>{formatDate(task.deadline)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {!loading && tasks.length === 0 && (
        <div className="empty-state">
          <SlidersHorizontal size={32} />
          <p>Задач не найдено. Попробуйте изменить фильтры.</p>
        </div>
      )}
    </section>
  );
}
