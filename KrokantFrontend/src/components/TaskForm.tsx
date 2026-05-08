import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "../api/client";
import type { Priority, User } from "../types";

type Props = {
  onCreated: () => void;
};

const priorityOptions: { value: Priority; label: string }[] = [
  { value: "HIGH", label: "🔴 Высокий" },
  { value: "MEDIUM", label: "🟡 Средний" },
  { value: "LOW", label: "🟢 Низкий" }
];

export function TaskForm({ onCreated }: Props) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getTeachers()
      .then((items) => {
        setTeachers(items);
        setAssigneeId(items[0]?.id ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Не удалось загрузить преподавателей"));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await api.createTask({ title, description, assigneeId, deadline, priority });
      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority("MEDIUM");
      setMessage("Задача создана");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать задачу");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-section narrow">
      <div className="section-title">
        <div>
          <p className="muted small">Новая задача</p>
          <h2>Создать задачу</h2>
        </div>
      </div>

      <form className="form-panel" onSubmit={submit}>
        <label>
          Название
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Кратко опишите задачу"
            required
          />
        </label>

        <label>
          Описание
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Подробности, требования, ссылки..."
            rows={5}
            required
          />
        </label>

        <div className="form-row-2">
          <label>
            Исполнитель
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
              {teachers.map((t) => (
                <option value={t.id} key={t.id}>{t.fullName}</option>
              ))}
            </select>
          </label>

          <label>
            Приоритет
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {priorityOptions.map((o) => (
                <option value={o.value} key={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Дедлайн
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </label>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        <button className="primary" type="submit" disabled={loading}>
          <Save size={16} />
          {loading ? "Сохраняем..." : "Создать задачу"}
        </button>
      </form>
    </section>
  );
}
