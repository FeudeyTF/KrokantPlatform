import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, Save } from "lucide-react";
import { api } from "../api/client";
import type { Task, TaskStatus, User } from "../types";
import {
  daysUntilDeadline,
  deadlineProgress,
  formatDate,
  nextStatuses,
  statusLabels,
  taskProgress,
  visibleStatus
} from "../utils/status";

type Props = {
  taskId: string;
  currentUser: User;
  onBack: () => void;
  onChanged: () => void;
};

export function TaskDetails({ taskId, currentUser, onBack, onChanged }: Props) {
  const [task, setTask] = useState<Task | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<TaskStatus>("NEW");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setError("");

    try {
      const [taskData, teacherData] = await Promise.all([
        api.getTask(taskId),
        currentUser.role === "HEAD" ? api.getTeachers() : Promise.resolve([])
      ]);

      setTask(taskData);
      setTitle(taskData.title);
      setDescription(taskData.description);
      setAssigneeId(taskData.assigneeId);
      setDeadline(taskData.deadline);
      setStatus(taskData.status);
      setTeachers(teacherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки задачи");
    }
  }

  useEffect(() => {
    void load();
  }, [taskId]);

  async function saveHeadChanges(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const updated = await api.updateTask(taskId, { title, description, assigneeId, deadline });
      setTask(updated);
      setMessage("Изменения сохранены");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить задачу");
    }
  }

  async function saveStatus() {
    setError("");
    setMessage("");

    try {
      await api.changeStatus(taskId, status);
      await load();
      setMessage("Статус обновлен");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить статус");
    }
  }

  async function saveDeadline(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.changeDeadline(taskId, deadline, comment);
      await load();
      setComment("");
      setMessage("Срок обновлен");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить срок");
    }
  }

  if (error && !task) {
    return (
      <section className="page-section">
        <button className="plain-link" onClick={onBack}>
          <ArrowLeft size={18} />
          Назад
        </button>
        <div className="error">{error}</div>
      </section>
    );
  }

  if (!task) {
    return <section className="page-section">Загрузка...</section>;
  }

  const statusView = visibleStatus(task);
  const workPercent = taskProgress(statusView);
  const deadlinePercent = deadlineProgress(task.deadline, statusView);
  const daysLeft = daysUntilDeadline(task.deadline);

  return (
    <section className="page-section narrow">
      <button className="plain-link" onClick={onBack}>
        <ArrowLeft size={18} />
        К списку
      </button>

      <div className="details-head">
        <span className={`badge ${statusView.toLowerCase()}`}>{statusLabels[statusView]}</span>
        <h2>{task.title}</h2>
        <p>{task.description}</p>
        <div className="task-meta">
          <span>{task.assigneeName}</span>
          <span>до {formatDate(task.deadline)}</span>
        </div>
        <div className="detail-progress">
          <div className="progress-row">
            <span>Выполнение</span>
            <strong>{workPercent}%</strong>
            <div className="progress-track">
              <div className="progress-fill progress" style={{ width: `${workPercent}%` }} />
            </div>
          </div>
          <div className="progress-row">
            <span>Срок</span>
            <strong>
              {daysLeft === null
                ? "нет срока"
                : daysLeft < 0
                  ? `${Math.abs(daysLeft)} дн. просрочки`
                  : `${daysLeft} дн. осталось`}
            </strong>
            <div className="progress-track">
              <div
                className={`progress-fill ${statusView === "OVERDUE" ? "danger" : "deadline"}`}
                style={{ width: `${deadlinePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {currentUser.role === "HEAD" && (
        <form className="form-panel" onSubmit={saveHeadChanges}>
          <h3>Редактирование</h3>
          <label>
            Название
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Описание
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </label>
          <label>
            Исполнитель
            <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
              {teachers.map((teacher) => (
                <option value={teacher.id} key={teacher.id}>
                  {teacher.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Дедлайн
            <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </label>
          <button className="secondary" type="submit">
            <Save size={18} />
            Сохранить
          </button>
        </form>
      )}

      <div className="form-panel">
        <h3>Статус</h3>
        <div className="inline-actions">
          <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
            {nextStatuses(task.status).map((item) => (
              <option value={item} key={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
          <button className="secondary" onClick={saveStatus} disabled={task.status === "DONE"}>
            <Save size={18} />
            Обновить
          </button>
        </div>
      </div>

      <form className="form-panel" onSubmit={saveDeadline}>
        <h3>Перенос срока</h3>
        <label>
          Новый дедлайн
          <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </label>
        <label>
          Комментарий
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
          />
        </label>
        <button className="secondary" type="submit">
          <CalendarClock size={18} />
          Изменить срок
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
    </section>
  );
}
