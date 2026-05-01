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

  const donePercent = summary?.totalTasks
    ? Math.round((summary.doneTasks / summary.totalTasks) * 100)
    : 0;
  const activePercent = summary?.totalTasks
    ? Math.round((summary.inProgressTasks / summary.totalTasks) * 100)
    : 0;
  const riskPercent = summary?.totalTasks
    ? Math.round((summary.overdueTasks / summary.totalTasks) * 100)
    : 0;

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

      <div className="overview-grid">
        <div className="summary-panel">
          <h3>Общий прогресс</h3>
          <div className="progress-list">
            <div className="progress-row">
              <span>Выполнено</span>
              <strong>{donePercent}%</strong>
              <div className="progress-track">
                <div className="progress-fill done" style={{ width: `${donePercent}%` }} />
              </div>
            </div>
            <div className="progress-row">
              <span>В работе</span>
              <strong>{activePercent}%</strong>
              <div className="progress-track">
                <div className="progress-fill progress" style={{ width: `${activePercent}%` }} />
              </div>
            </div>
            <div className="progress-row">
              <span>Риск просрочки</span>
              <strong>{riskPercent}%</strong>
              <div className="progress-track">
                <div className="progress-fill danger" style={{ width: `${riskPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="summary-panel">
          <h3>Состояние задач</h3>
          <div className="status-breakdown">
            <div>
              <span>Новые</span>
              <strong>{summary?.newTasks ?? 0}</strong>
            </div>
            <div>
              <span>В работе</span>
              <strong>{summary?.inProgressTasks ?? 0}</strong>
            </div>
            <div>
              <span>Просрочено</span>
              <strong>{summary?.overdueTasks ?? 0}</strong>
            </div>
          </div>
        </div>
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
                <td>
                  <div className="workload-name">
                    <strong>{item.teacherName}</strong>
                    <div className="mini-progress">
                      <span
                        style={{
                          width: `${Math.min(100, (item.new + item.inProgress + item.overdue) * 12)}%`
                        }}
                      />
                    </div>
                  </div>
                </td>
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
