import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, ListTodo, CalendarDays, TrendingUp } from "lucide-react";
import { api } from "../api/client";
import type { DashboardSummary, Task, WorkloadItem } from "../types";
import { daysUntilDeadline, formatDate, isOverdue, visibleStatus } from "../utils/status";

const cards = [
	{ key: "totalTasks", label: "Всего задач", icon: ListTodo, color: "" },
	{ key: "newTasks", label: "Новые", icon: Clock3, color: "stat-new" },
	{ key: "inProgressTasks", label: "В работе", icon: TrendingUp, color: "stat-progress" },
	{ key: "doneTasks", label: "Готово", icon: CheckCircle2, color: "stat-done" },
	{ key: "overdueTasks", label: "Просрочено", icon: AlertTriangle, color: "stat-overdue" }
] as const;

type Props = {
	onSelectTask: (id: string) => void;
};

export function Dashboard({ onSelectTask }: Props) {
	const [summary, setSummary] = useState<DashboardSummary | null>(null);
	const [workload, setWorkload] = useState<WorkloadItem[]>([]);
	const [upcoming, setUpcoming] = useState<Task[]>([]);
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
		Promise.all([api.getSummary(), api.getWorkload(), api.getUpcoming(7)])
			.then(([summaryData, workloadData, upcomingData]) => {
				setSummary(summaryData);
				setWorkload(workloadData);
				setUpcoming(upcomingData);
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

				{/* Алерт о просрочках */}
				{summary && summary.overdueTasks > 0 && (
					<div className="overdue-banner">
						<AlertTriangle size={18} />
						<span>
							<strong>{summary.overdueTasks}</strong>{" "}
							{summary.overdueTasks === 1 ? "задача просрочена" : summary.overdueTasks < 5 ? "задачи просрочено" : "задач просрочено"}
							{" "}— требуется внимание
						</span>
					</div>
				)}

				{/* Стат-карточки */}
				<div className="stats-grid">
					{cards.map(({ key, label, icon: Icon, color }) => (
						<div className={`stat-card ${color}`} key={key}>
							<Icon size={20} />
							<span>{label}</span>
							<strong>{summary ? summary[key] : "–"}</strong>
						</div>
					))}
				</div>

				{/* Прогресс + статусы */}
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
								<strong style={{ color: summary?.overdueTasks ? "#d62860" : undefined }}>
									{summary?.overdueTasks ?? 0}
								</strong>
							</div>
						</div>
					</div>
				</div>

				{/* Ближайшие дедлайны */}
				{upcoming.length > 0 && (
					<div className="summary-panel">
						<h3>
							<CalendarDays size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
							Ближайшие дедлайны (7 дней)
						</h3>
						<div className="upcoming-list">
							{upcoming.map((task) => {
								const daysLeft = daysUntilDeadline(task.deadline);
								const statusView = visibleStatus(task);
								const urgent = daysLeft !== null && daysLeft <= 2;
								return (
									<button
										key={task.id}
										className="upcoming-item"
										onClick={() => onSelectTask(task.id)}
									>
										<div className="upcoming-left">
											<span className={`badge ${statusView.toLowerCase()}`} />
											<span className="upcoming-title">{task.title}</span>
										</div>
										<div className="upcoming-right">
											<span className="upcoming-assignee">{task.assigneeName}</span>
											<span className={`upcoming-days ${urgent ? "urgent" : ""}`}>
												{daysLeft === 0
													? "сегодня"
													: daysLeft === 1
														? "завтра"
														: `${daysLeft} дн.`}
											</span>
											<span className="upcoming-date">{formatDate(task.deadline)}</span>
										</div>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* Нагрузка по преподавателям */}
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
									<td>
										{item.overdue > 0 ? (
											<span style={{ color: "#d62860", fontWeight: 700 }}>{item.overdue}</span>
										) : (
											item.overdue
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
		</section>
	);
}
