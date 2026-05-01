import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../api/client";
import type { Task, User } from "../types";
import {
  daysUntilDeadline,
  deadlineProgress,
  formatDate,
  statusLabels,
  taskProgress,
  visibleStatus
} from "../utils/status";

type Props = {
  currentUser: User;
  refreshKey: number;
  onSelectTask: (id: string) => void;
};

export function TaskList({ currentUser, refreshKey, onSelectTask }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [taskData, teacherData] = await Promise.all([
        api.getTasks({ search, status, assigneeId, page: 1, limit: 20 }),
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

  return (
    <section className="page-section">
      <div className="section-title">
        <div>
          <p className="muted small">Всего найдено: {total}</p>
          <h2>Задачи</h2>
        </div>
      </div>

      <form className="filters" onSubmit={submit}>
        <label>
          Поиск
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Название или описание"
          />
        </label>

        <label>
          Статус
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Все</option>
            <option value="NEW">Новые</option>
            <option value="IN_PROGRESS">В работе</option>
            <option value="DONE">Готово</option>
          </select>
        </label>

        {currentUser.role === "HEAD" && (
          <label>
            Исполнитель
            <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
              <option value="">Все</option>
              {teachers.map((teacher) => (
                <option value={teacher.id} key={teacher.id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </label>
        )}

        <button className="secondary" type="submit">
          <Search size={18} />
          Найти
        </button>
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
              <span className={`badge ${statusView.toLowerCase()}`}>{statusLabels[statusView]}</span>
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

      {!loading && tasks.length === 0 && <p className="muted">Задач пока нет.</p>}
    </section>
  );
}
