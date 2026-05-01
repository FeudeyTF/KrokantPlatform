import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "../api/client";
import type { User } from "../types";

type Props = {
  onCreated: () => void;
};

export function TaskForm({ onCreated }: Props) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [deadline, setDeadline] = useState("");
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
      await api.createTask({ title, description, assigneeId, deadline });
      setTitle("");
      setDescription("");
      setDeadline("");
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
          <p className="muted small">Для руководителя</p>
          <h2>Создать задачу</h2>
        </div>
      </div>

      <form className="form-panel" onSubmit={submit}>
        <label>
          Название
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>

        <label>
          Описание
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            required
          />
        </label>

        <label>
          Исполнитель
          <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} required>
            {teachers.map((teacher) => (
              <option value={teacher.id} key={teacher.id}>
                {teacher.fullName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Дедлайн
          <input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            required
          />
        </label>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        <button className="primary" type="submit" disabled={loading}>
          <Save size={18} />
          {loading ? "Сохраняем..." : "Создать"}
        </button>
      </form>
    </section>
  );
}
