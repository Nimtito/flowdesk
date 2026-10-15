
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../Services/api";
import "./Reports.css";

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getErrorMessage(error) {
  if (!error.response) {
    return "Cannot connect to the server. Make sure Django is running.";
  }

  if (error.response.status === 401) {
    return "Your session may have expired. Please log in again.";
  }

  if (error.response.status === 403) {
    return "You do not have permission to view some report data.";
  }

  return (
    error.response.data?.detail ||
    error.response.data?.message ||
    "Unable to load reports. Please try again."
  );
}

function getTaskStatus(task) {
  return String(task.status || "todo").toLowerCase();
}

function getProjectStatus(project) {
  return String(project.status || "planning").toLowerCase();
}

function formatStatus(status) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isCompleted(status) {
  return ["completed", "complete", "done"].includes(status);
}

function isOverdue(task) {
  if (!task.due_date || isCompleted(getTaskStatus(task))) return false;

  const dueDate = new Date(`${task.due_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return !Number.isNaN(dueDate.getTime()) && dueDate < today;
}

function StatCard({ label, value, detail, icon, color }) {
  return (
    <article className={`report-stat-card ${color}`}>
      <div className="report-stat-top">
        <span className="report-stat-label">{label}</span>
        <span className="report-stat-icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="report-stat-value">{value}</div>
      <p className="report-stat-detail">{detail}</p>
    </article>
  );
}

function BreakdownRow({ label, count, total, color }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="report-breakdown-row">
      <div className="report-breakdown-label">
        <span className={`report-dot ${color}`} />
        <span>{label}</span>
        <strong>{count}</strong>
      </div>

      <div
        className="report-progress-track"
        role="progressbar"
        aria-label={`${label} percentage`}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`report-progress-fill ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <span className="report-percentage">{percentage}%</span>
    </div>
  );
}

export default function Reports() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const results = await Promise.allSettled([
        api.get("/projects/"),
        api.get("/tasks/"),
      ]);

      const projectResult = results[0];
      const taskResult = results[1];

      const errors = [];

      if (projectResult.status === "fulfilled") {
        setProjects(getList(projectResult.value.data));
      } else {
        errors.push(getErrorMessage(projectResult.reason));
      }

      if (taskResult.status === "fulfilled") {
        setTasks(getList(taskResult.value.data));
      } else {
        errors.push(getErrorMessage(taskResult.reason));
      }

      if (errors.length === 2) {
        setError(errors.join(" "));
      } else if (errors.length === 1) {
        setError(
          `${errors[0]} Some report sections may be incomplete.`
        );
      }

      setLastUpdated(new Date());
    } catch {
      setError("Unable to load report data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const statistics = useMemo(() => {
    const completedTasks = tasks.filter((task) =>
      isCompleted(getTaskStatus(task))
    ).length;

    const inProgressTasks = tasks.filter((task) =>
      ["in_progress", "in progress"].includes(getTaskStatus(task))
    ).length;

    const todoTasks = tasks.filter((task) =>
      ["todo", "to_do", "to do", "pending"].includes(getTaskStatus(task))
    ).length;

    const completedProjects = projects.filter((project) =>
      isCompleted(getProjectStatus(project))
    ).length;

    const activeProjects = projects.filter((project) =>
      ["active", "in_progress", "in progress"].includes(
        getProjectStatus(project)
      )
    ).length;

    const planningProjects = projects.filter((project) =>
      ["planning", "planned"].includes(getProjectStatus(project))
    ).length;

    const overdueTasks = tasks.filter(isOverdue).length;
    const completionRate =
      tasks.length > 0
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

    return {
      completedTasks,
      inProgressTasks,
      todoTasks,
      completedProjects,
      activeProjects,
      planningProjects,
      overdueTasks,
      completionRate,
    };
  }, [projects, tasks]);

  if (loading) {
    return (
      <main className="reports-page">
        <div className="reports-loading">
          <div className="reports-spinner" />
          <p>Preparing your reports...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="reports-page">
      <header className="reports-header">
        <div>
          <p className="reports-eyebrow">WORKSPACE INSIGHTS</p>
          <h1>Reports &amp; Analytics</h1>
          <p className="reports-subtitle">
            Understand project progress, task completion, and workload
            across your workspace.
          </p>
        </div>

        <button
          type="button"
          className="reports-refresh-button"
          onClick={() => loadReports(true)}
          disabled={refreshing}
        >
          <span aria-hidden="true">{refreshing ? "↻" : "⟳"}</span>
          {refreshing ? "Refreshing..." : "Refresh reports"}
        </button>
      </header>

      {error && (
        <div className="reports-error" role="alert">
          <strong>Some data could not be loaded.</strong>
          <p>{error}</p>
          <button type="button" onClick={() => loadReports(true)}>
            Try again
          </button>
        </div>
      )}

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Workspace overview</h2>
            <p>Your current project and task totals.</p>
          </div>
          {lastUpdated && (
            <span className="reports-updated">
              Updated {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <div className="reports-stats-grid">
          <StatCard
            label="Total projects"
            value={projects.length}
            detail={`${statistics.activeProjects} currently active`}
            icon="▦"
            color="purple"
          />
          <StatCard
            label="Total tasks"
            value={tasks.length}
            detail={`${statistics.completedTasks} completed`}
            icon="☷"
            color="blue"
          />
          <StatCard
            label="Completion rate"
            value={`${statistics.completionRate}%`}
            detail="Of all available tasks"
            icon="↗"
            color="green"
          />
          <StatCard
            label="Overdue tasks"
            value={statistics.overdueTasks}
            detail="Uncompleted tasks past due date"
            icon="◷"
            color="orange"
          />
        </div>
      </section>

      <div className="reports-analysis-grid">
        <section className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <h2>Project status</h2>
              <p>How your projects are progressing.</p>
            </div>
            <span className="reports-panel-total">{projects.length}</span>
          </div>

          {projects.length === 0 ? (
            <div className="reports-empty">
              No project data is available yet.
            </div>
          ) : (
            <div className="reports-breakdown">
              <BreakdownRow
                label="Active"
                count={statistics.activeProjects}
                total={projects.length}
                color="blue"
              />
              <BreakdownRow
                label="Planning"
                count={statistics.planningProjects}
                total={projects.length}
                color="purple"
              />
              <BreakdownRow
                label="Completed"
                count={statistics.completedProjects}
                total={projects.length}
                color="green"
              />
            </div>
          )}
        </section>

        <section className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <h2>Task status</h2>
              <p>A breakdown of your available tasks.</p>
            </div>
            <span className="reports-panel-total">{tasks.length}</span>
          </div>

          {tasks.length === 0 ? (
            <div className="reports-empty">
              No task data is available yet.
            </div>
          ) : (
            <div className="reports-breakdown">
              <BreakdownRow
                label="To do"
                count={statistics.todoTasks}
                total={tasks.length}
                color="purple"
              />
              <BreakdownRow
                label="In progress"
                count={statistics.inProgressTasks}
                total={tasks.length}
                color="blue"
              />
              <BreakdownRow
                label="Completed"
                count={statistics.completedTasks}
                total={tasks.length}
                color="green"
              />
            </div>
          )}
        </section>
      </div>

      <section className="reports-panel reports-task-summary">
        <div className="reports-panel-heading">
          <div>
            <h2>Task summary</h2>
            <p>A quick look at the work that needs attention.</p>
          </div>
        </div>

        <div className="reports-summary-grid">
          <div className="reports-summary-item">
            <span className="reports-summary-indicator purple" />
            <div>
              <span>Tasks to do</span>
              <strong>{statistics.todoTasks}</strong>
            </div>
          </div>

          <div className="reports-summary-item">
            <span className="reports-summary-indicator blue" />
            <div>
              <span>In progress</span>
              <strong>{statistics.inProgressTasks}</strong>
            </div>
          </div>

          <div className="reports-summary-item">
            <span className="reports-summary-indicator green" />
            <div>
              <span>Completed</span>
              <strong>{statistics.completedTasks}</strong>
            </div>
          </div>

          <div className="reports-summary-item">
            <span className="reports-summary-indicator orange" />
            <div>
              <span>Overdue</span>
              <strong>{statistics.overdueTasks}</strong>
            </div>
          </div>
        </div>
      </section>

      <footer className="reports-footer">
        Reports are calculated from project and task records available to
        your account. Your results may differ depending on your permissions.
      </footer>
    </main>
  );
}
