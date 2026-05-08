import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, MessageSquare, Clock, Save, Send } from "lucide-react";
import { api } from "../api/client";
import type { Priority, Task, TaskStatus, User } from "../types";
import {
  daysUntilDeadline,
  deadlineProgress,
  formatDate,
  formatTimeAgo,
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

const priorityLabel: Record<Priority, string> = {
  HIGH: "Высокий",
  MEDIUM: "Средний",
  LOW: "Низкий"
};

type Tab = "comments" | "activity";

export function TaskDetails({ taskId, currentUser, onBack, onChanged }: Props) {
  const [task, setTask] = useState<Task | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<TaskStatus>("NEW");
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("comments");
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
      setPriority(taskData.priority);
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
      const updated = await api.updateTask(taskId, { title, description, assigneeId, deadline, priority });
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
      setMessage("Статус обновлён");
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
      setMessage("Срок обновлён");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить срок");
    }
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!newComment.trim()) return;
    setSendingComment(true);

    try {
      await api.addComment(taskId, newComment.trim());
      setNewComment("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить комментарий");
    } finally {
      setSendingComment(false);
    }
  }

  if (error && !task) {
    return (
      <section className="page-section">
        <button className="plain-link" onClick={onBack}>
          <ArrowLeft size={16} />
          Назад
        </button>
        <div className="error">{error}</div>
      </section>
    );
  }

  if (!task) {
    return (
      <section className="page-section">
        <div className="loading-pulse">Загрузка...</div>
      </section>
    );
  }

  const statusView = visibleStatus(task);
  const workPercent = taskProgress(statusView);
  const deadlinePercent = deadlineProgress(task.deadline, statusView);
  const daysLeft = daysUntilDeadline(task.deadline);

  return (
    <section className="page-section narrow">
      <button className="plain-link" onClick={onBack}>
        <ArrowLeft size={16} />
        К списку
      </button>

      {/* ── Шапка задачи ── */}
      <div className="details-head">
        <div className="details-badges">
          <span className={`badge ${statusView.toLowerCase()}`}>{statusLabels[statusView]}</span>
          <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
            {priorityLabel[task.priority]}
          </span>
        </div>
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

      {/* ── Редактирование (только HEAD) ── */}
      {currentUser.role === "HEAD" && (
        <form className="form-panel" onSubmit={saveHeadChanges}>
          <h3>Редактирование</h3>
          <label>
            Название
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Описание
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </label>
          <div className="form-row-2">
            <label>
              Исполнитель
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                {teachers.map((t) => (
                  <option value={t.id} key={t.id}>{t.fullName}</option>
                ))}
              </select>
            </label>
            <label>
              Приоритет
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="HIGH">🔴 Высокий</option>
                <option value="MEDIUM">🟡 Средний</option>
                <option value="LOW">🟢 Низкий</option>
              </select>
            </label>
          </div>
          <label>
            Дедлайн
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
          <button className="secondary" type="submit">
            <Save size={15} />
            Сохранить изменения
          </button>
        </form>
      )}

      {/* ── Обновление статуса ── */}
      <div className="form-panel">
        <h3>Статус задачи</h3>
        <div className="inline-actions">
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {nextStatuses(task.status).map((item) => (
              <option value={item} key={item}>{statusLabels[item]}</option>
            ))}
          </select>
          <button className="secondary" onClick={saveStatus} disabled={task.status === "DONE"}>
            <Save size={15} />
            Обновить
          </button>
        </div>
      </div>

      {/* ── Перенос срока ── */}
      <form className="form-panel" onSubmit={saveDeadline}>
        <h3>Перенос срока</h3>
        <label>
          Новый дедлайн
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
        <label>
          Причина переноса
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Укажите причину (необязательно)"
          />
        </label>
        <button className="secondary" type="submit">
          <CalendarClock size={15} />
          Изменить срок
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      {/* ── Комментарии / История ── */}
      <div className="form-panel detail-tab-panel">
        <div className="detail-tabs">
          <button
            type="button"
            className={`detail-tab ${activeTab === "comments" ? "active" : ""}`}
            onClick={() => setActiveTab("comments")}
          >
            <MessageSquare size={14} />
            Комментарии
            {task.comments.length > 0 && (
              <span className="tab-count">{task.comments.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`detail-tab ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            <Clock size={14} />
            История
            {task.activity.length > 0 && (
              <span className="tab-count">{task.activity.length}</span>
            )}
          </button>
        </div>

        {activeTab === "comments" && (
          <div className="tab-content">
            {task.comments.length === 0 ? (
              <p className="muted tab-empty">Пока нет комментариев. Будьте первым!</p>
            ) : (
              <div className="comment-list">
                {task.comments.map((c) => (
                  <div className="comment-item" key={c.id}>
                    <div className="comment-avatar">
                      {c.authorName.charAt(0)}
                    </div>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <strong>{c.authorName}</strong>
                        <span>{formatTimeAgo(c.createdAt)}</span>
                      </div>
                      <p>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form className="comment-form" onSubmit={submitComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Напишите комментарий..."
                rows={2}
              />
              <button
                className="secondary"
                type="submit"
                disabled={sendingComment || !newComment.trim()}
              >
                <Send size={14} />
                Отправить
              </button>
            </form>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="tab-content">
            {task.activity.length === 0 ? (
              <p className="muted tab-empty">История изменений пуста.</p>
            ) : (
              <div className="activity-list">
                {[...task.activity].reverse().map((entry) => (
                  <div className="activity-item" key={entry.id}>
                    <div className="activity-dot" />
                    <div className="activity-body">
                      <span className="activity-action">{entry.action}</span>
                      <span className="activity-meta">
                        {entry.actorName} · {formatTimeAgo(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
