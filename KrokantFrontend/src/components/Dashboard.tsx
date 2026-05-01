import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, ListTodo } from "lucide-react";
import { api } from "../api/client";
import type { DashboardSummary, WorkloadItem } from "../types";

const cards = [
  { key: "totalTasks", label: "Всего задач", icon: ListTodo },
  { key: "newTasks", label: "Новые", icon: Clock3 },
  { key: "inProgressTasks", label: "В работе", icon: ListTodo },
  { key: "doneTasks", label: "Готово", icon: CheckCircle2 },
  { key: "overdueTasks", label: "Просрочено", icon: AlertTriangle }
] as const;

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getSummary(), api.getWorkload()])
      .then(([summaryData, workloadData]) => {
        setSummary(summaryData);
        setWorkload(workloadData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка загрузки"));
  }, []);

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <section className="page-section">
      <div className="section-title">
        <div>
          <p className="muted small">Общая картина</p>
          <h2>Dashboard</h2>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map(({ key, label, icon: Icon }) => (
          <div className="stat-card" key={key}>
            <Icon size={22} />
            <span>{label}</span>
            <strong>{summary ? summary[key] : "-"}</strong>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <h3>Нагрузка по преподавателям</h3>
        <table>
          <thead>
            <tr>
              <th>Преподаватель</th>
              <th>Новые</th>
              <th>В работе</th>
              <th>Готово</th>
              <th>Просрочено</th>
            </tr>
          </thead>
          <tbody>
            {workload.map((item) => (
              <tr key={item.teacherId}>
                <td>{item.teacherName}</td>
                <td>{item.new}</td>
                <td>{item.inProgress}</td>
                <td>{item.done}</td>
                <td>{item.overdue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
