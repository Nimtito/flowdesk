import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../Services/api";
import "./Dashboard.css";

const initialStats = {
  projects: 0,
  tasks: 0,
  completed: 0,
  overdue: 0,
};

function getResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getCount(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (Array.isArray(value)) return value.length;

  return fallback;
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "completed") return "status-completed";
  if (value === "active" || value === "in_progress") return "status-active";
  if (value === "planning" || value === "todo") return "status-planning";

  return "status-default";
}

function formatDate(date) {
  if (!date) return "No deadline";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "No deadline";

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(task) {
  const deadline = task.due_date || task.deadline;

  if (!deadline || task.status === "completed") return false;

  const parsed = new Date(deadline);

  if (Number.isNaN(parsed.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  return parsed < today;
}

function getRecentItems(items) {
  return [...items]
    .sort((a, b) => {
      const dateA = new Date(
        a.updated_at || a.created_at || a.start_date || 0
      ).getTime();

      const dateB = new Date(
        b.updated_at || b.created_at || b.start_date || 0
      ).getTime();

      return (
        (Number.isNaN(dateB) ? 0 : dateB) -
        (Number.isNaN(dateA) ? 0 : dateA)
      );
    })
    .slice(0, 5);
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(initialStats);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboard = useCallback(async (signal) => {
    const token = localStorage.getItem("flowdesk_access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setErrors([]);

    const requests = await Promise.allSettled([
      api.get("/dashboard/", { signal }),
      api.get("/projects/", { signal }),
      api.get("/tasks/", { signal }),
      api.get("/profile/", { signal }),
    ]);

    if (signal.aborted) return;

    const [statsResult, projectsResult, tasksResult, profileResult] =
      requests;

    const failures = [];
    const projectItems =
      projectsResult.status === "fulfilled"
        ? getResults(projectsResult.value.data)
        : [];

    const taskItems =
      tasksResult.status === "fulfilled"
        ? getResults(tasksResult.value.data)
        : [];

    if (projectsResult.status === "fulfilled") {
      setProjects(projectItems);
    } else {
      failures.push("Projects");
    }

    if (tasksResult.status === "fulfilled") {
      setTasks(taskItems);
    } else {
      failures.push("Tasks");
    }

    if (profileResult.status === "fulfilled") {
      setUser(profileResult.value.data);
    } else if (profileResult.reason?.response?.status === 401) {
      localStorage.removeItem("flowdesk_access_token");
      localStorage.removeItem("flowdesk_refresh_token");
      navigate("/login", { replace: true });
      return;
    } else {
      failures.push("Profile");
    }

    const completedFallback = taskItems.filter(
      (task) => String(task.status || "").toLowerCase() === "completed"
    ).length;

    const overdueFallback = taskItems.filter(isOverdue).length;

    const dashboardData =
      statsResult.status === "fulfilled"
        ? statsResult.value.data
        : {};

    setStats({
      projects: getCount(
        dashboardData.total_projects ??
          dashboardData.projects_count ??
          dashboardData.projects,
        projectItems.length
      ),
      tasks: getCount(
        dashboardData.total_tasks ??
          dashboardData.tasks_count ??
          dashboardData.tasks,
        taskItems.length
      ),
      completed: getCount(
        dashboardData.completed_tasks ??
          dashboardData.completed_tasks_count,
        completedFallback
      ),
      overdue: getCount(
        dashboardData.overdue_tasks ??
          dashboardData.overdue_tasks_count,
        overdueFallback
      ),
    });

    setErrors(failures);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();

    loadDashboard(controller.signal);

    return () => controller.abort();
  }, [loadDashboard, refreshKey]);

  function handleLogout() {
    localStorage.removeItem("flowdesk_access_token");
    localStorage.removeItem("flowdesk_refresh_token");
    navigate("/login", { replace: true });
  }

  const displayName =
    user?.first_name ||
    user?.username ||
    "there";

  const recentProjects = getRecentItems(projects);
  const recentTasks = getRecentItems(tasks);

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="dashboard-logo">F</span>
          <span>FlowDesk</span>
        </Link>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="dashboard-nav">
          <Link to="/dashboard" className="dashboard-nav-link active">
            <span className="nav-icon">▦</span>
            Dashboard
          </Link>

          <Link to="/projects" className="dashboard-nav-link">
            <span className="nav-icon">▣</span>
            Projects
          </Link>

          <Link to="/tasks" className="dashboard-nav-link">
            <span className="nav-icon">✓</span>
            My Tasks
          </Link>

          <Link to="/team" className="dashboard-nav-link">
            <span className="nav-icon">♧</span>
            Team
          </Link>

          <div className="sidebar-section-label sidebar-section-spaced">
            ORGANIZE
          </div>

          <Link to="/notifications" className="dashboard-nav-link">
            <span className="nav-icon">♧</span>
            Notifications
          </Link>

          <Link to="/reports" className="dashboard-nav-link">
            <span className="nav-icon">▤</span>
            Reports
          </Link>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <Link to="/profile" className="dashboard-nav-link">
            <span className="nav-icon">◉</span>
            My Profile
          </Link>

          <Link to="/settings" className="dashboard-nav-link">
            <span className="nav-icon">⚙</span>
            Settings
          </Link>

          <button
            type="button"
            className="dashboard-nav-link dashboard-logout"
            onClick={handleLogout}
          >
            <span className="nav-icon">↪</span>
            Sign out
          </button>

          <div className="sidebar-version">FlowDesk Workspace</div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-breadcrumb">
              Workspace / Overview
            </span>
          </div>

          <Link to="/profile" className="dashboard-user">
            <span className="dashboard-avatar">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="dashboard-user-name">{displayName}</span>
          </Link>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow">YOUR WORKSPACE</span>
              <h1>Good to see you, {displayName}.</h1>
              <p>
                Here's an overview of your projects and the work ahead.
              </p>
            </div>

            <div className="dashboard-actions">
              <button
                type="button"
                className="dashboard-primary-button"
                onClick={() => setRefreshKey((key) => key + 1)}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "↻ Refresh"}
              </button>

              <Link to="/projects" className="dashboard-primary-button">
                <span>+</span> View projects
              </Link>
            </div>
          </section>

          {errors.length > 0 && (
            <div className="dashboard-alert" role="alert">
              <strong>Some dashboard data couldn't be loaded.</strong>
              <p>
                Check your connection or permissions for: {errors.join(", ")}.
                Your account may not have access to every resource.
              </p>
              <button
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                disabled={loading}
              >
                Try again
              </button>
            </div>
          )}

          <section className="dashboard-stats">
            <article className="dashboard-stat-card">
              <div className="stat-card-top">
                <span className="stat-label">Total projects</span>
                <span className="stat-icon stat-icon-purple">▣</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : stats.projects}
              </div>
              <p>Projects in your workspace</p>
            </article>

            <article className="dashboard-stat-card">
              <div className="stat-card-top">
                <span className="stat-label">Total tasks</span>
                <span className="stat-icon stat-icon-blue">☷</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : stats.tasks}
              </div>
              <p>Tasks across your workspace</p>
            </article>

            <article className="dashboard-stat-card">
              <div className="stat-card-top">
                <span className="stat-label">Completed tasks</span>
                <span className="stat-icon stat-icon-green">✓</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : stats.completed}
              </div>
              <p>Tasks marked as completed</p>
            </article>

            <article className="dashboard-stat-card">
              <div className="stat-card-top">
                <span className="stat-label">Overdue tasks</span>
                <span className="stat-icon stat-icon-orange">!</span>
              </div>
              <div className="stat-number">
                {loading ? "—" : stats.overdue}
              </div>
              <p>Tasks past their deadline</p>
            </article>
          </section>

          <section className="dashboard-panels">
            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Recent projects</h2>
                  <p>Keep track of work in progress.</p>
                </div>
                <Link to="/projects" className="dashboard-text-link">
                  View all →
                </Link>
              </div>

              {loading ? (
                <p className="dashboard-empty">Loading projects...</p>
              ) : projectsResultUnavailable(errors) ? (
                <div className="dashboard-empty">
                  <strong>Projects couldn't be loaded</strong>
                  <p>Refresh the dashboard and try again.</p>
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="dashboard-empty">
                  <span className="empty-symbol">▣</span>
                  <strong>No projects to show yet</strong>
                  <p>Projects will appear here when they're available.</p>
                </div>
              ) : (
                <div className="dashboard-list">
                  {recentProjects.map((project) => (
                    <div className="dashboard-project-row" key={project.id}>
                      <div className="project-initial">
                        {String(project.name || "P").charAt(0).toUpperCase()}
                      </div>
                      <div className="project-row-main">
                        <strong>{project.name || "Untitled project"}</strong>
                        <span>
                          Due {formatDate(project.end_date || project.deadline)}
                        </span>
                      </div>
                      <span
                        className={`dashboard-status ${getStatusClass(project.status)}`}
                      >
                        {String(project.status || "Unknown").replaceAll("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Recent tasks</h2>
                  <p>Stay on top of your next steps.</p>
                </div>
                <Link to="/tasks" className="dashboard-text-link">
                  View all →
                </Link>
              </div>

              {loading ? (
                <p className="dashboard-empty">Loading tasks...</p>
              ) : tasksResultUnavailable(errors) ? (
                <div className="dashboard-empty">
                  <strong>Tasks couldn't be loaded</strong>
                  <p>Refresh the dashboard and try again.</p>
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="dashboard-empty">
                  <span className="empty-symbol">✓</span>
                  <strong>No tasks to show yet</strong>
                  <p>Assigned tasks will appear here.</p>
                </div>
              ) : (
                <div className="dashboard-list">
                  {recentTasks.map((task) => (
                    <div className="dashboard-task-row" key={task.id}>
                      <span className="task-check">
                        {String(task.status || "").toLowerCase() === "completed"
                          ? "✓"
                          : ""}
                      </span>
                      <div className="task-row-main">
                        <strong>
                          {task.title || task.name || "Untitled task"}
                        </strong>
                        <span>
                          Due {formatDate(task.due_date || task.deadline)}
                        </span>
                      </div>
                      <span
                        className={`dashboard-status ${getStatusClass(task.status)}`}
                      >
                        {String(task.status || "Unknown").replaceAll("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>

          <footer className="dashboard-footer">
            FlowDesk · Your projects, organized.
          </footer>
        </div>
      </main>
    </div>
  );
}

function projectsResultUnavailable(errors) {
  return errors.includes("Projects");
}

function tasksResultUnavailable(errors) {
  return errors.includes("Tasks");
}