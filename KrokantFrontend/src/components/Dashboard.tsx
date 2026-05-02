import { useEffect, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    ListTodo,
    UserRound
} from "lucide-react";
import { api } from "../api/client";
import type { DashboardSummary, WorkloadItem } from "../types";

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
                    <p className="muted small">Общая картина по задачам</p>
                    <h2>Панель управления</h2>
                </div>
            </div>

            <div className="summary-panel dashboard-summary-panel">
                <h3>Сводка по задачам</h3>

                <div className="dashboard-summary-grid">
                    <div className="dashboard-summary-card">
                        <div className="dashboard-summary-icon total">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <span>Всего задач</span>
                            <strong>{summary?.totalTasks ?? 0}</strong>
                        </div>
                    </div>

                    <div className="dashboard-summary-card">
                        <div className="dashboard-summary-icon progress">
                            <ListTodo size={24} />
                        </div>
                        <div>
                            <span>В работе</span>
                            <strong>{summary?.inProgressTasks ?? 0}</strong>
                        </div>
                    </div>

                    <div className="dashboard-summary-card">
                        <div className="dashboard-summary-icon done">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <span>Готово</span>
                            <strong>{summary?.doneTasks ?? 0}</strong>
                        </div>
                    </div>

                    <div className="dashboard-summary-card">
                        <div className="dashboard-summary-icon danger">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <span>Просрочено</span>
                            <strong>{summary?.overdueTasks ?? 0}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="summary-panel workload-panel">
                <div>
                    <p className="muted small">Распределение задач между преподавателями</p>
                    <h3>Нагрузка по преподавателям</h3>
                </div>

                <div className="workload-table-wrap">
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
                                        <div className="workload-teacher">
                                            <UserRound size={18} />
                                            <strong>{item.teacherName}</strong>
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
            </div>
        </section>
    );
}