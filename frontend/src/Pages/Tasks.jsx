
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Services/api";
import "./Tasks.css";

const initialForm = {
  title: "",
  description: "",
  project: "",
  assigned_to: "",
  status: "todo",
  priority: "medium",
  due_date: "",
};

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getErrorMessage(error) {
  const data = error.response?.data;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, value]) => {
        const message = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "string"
            ? value
            : JSON.stringify(value);

        return `${field}: ${message}`;
      })
      .join(" | ");
  }

  return "Unable to complete the request. Check that Django is running.";
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).split("T")[0];
}

export default function Tasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadTasks() {
    setLoading(true);

    try {
      const response = await api.get("/tasks/");
      setTasks(getList(response.data));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    const results = await Promise.allSettled([
      api.get("/projects/"),
      api.get("/users/"),
      api.get("/profile/"),
    ]);

    if (results[0].status === "fulfilled") {
      setProjects(getList(results[0].value.data));
    }

    if (results[1].status === "fulfilled") {
      setUsers(getList(results[1].value.data));
    }

    if (results[2].status === "fulfilled") {
      const profile = results[2].value.data;
      setCurrentUser(profile);

      setForm((previous) => ({
        ...previous,
        assigned_to:
          previous.assigned_to || String(profile.id || ""),
      }));
    }
  }

  useEffect(() => {
    loadTasks();
    loadOptions();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      ...initialForm,
      assigned_to: currentUser?.id ? String(currentUser.id) : "",
    });
    setEditingId(null);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      project: Number(form.project),
      assigned_to: Number(form.assigned_to),
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
    };

    try {
      if (editingId !== null) {
        await api.patch(`/tasks/${editingId}/`, payload);
        setMessage("Task updated successfully.");
      } else {
        await api.post("/tasks/", payload);
        setMessage("Task created successfully.");
      }

      setForm({
        ...initialForm,
        assigned_to: currentUser?.id
          ? String(currentUser.id)
          : "",
      });

      setEditingId(null);
      await loadTasks();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(task) {
    setEditingId(task.id);

    setForm({
      title: task.title || "",
      description: task.description || "",
      project: task.project ? String(task.project) : "",
      assigned_to: task.assigned_to
        ? String(task.assigned_to)
        : currentUser?.id
          ? String(currentUser.id)
          : "",
      status: task.status || "todo",
      priority: task.priority || "medium",
      due_date: task.due_date
        ? String(task.due_date).split("T")[0]
        : "",
    });

    setError("");
    setMessage("");

    document
      .getElementById("task-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleDelete(task) {
    if (
      !window.confirm(
        `Delete task "${task.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.delete(`/tasks/${task.id}/`);
      setTasks((previous) =>
        previous.filter((item) => item.id !== task.id)
      );
      setMessage("Task deleted successfully.");

      if (editingId === task.id) resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function handleSignOut() {
    localStorage.removeItem("flowdesk_access_token");
    localStorage.removeItem("flowdesk_refresh_token");
    navigate("/login");
  }

  const availableUsers = [
    ...users,
    ...(currentUser?.id &&
    !users.some((user) => user.id === currentUser.id)
      ? [currentUser]
      : []),
  ].filter(
    (user, index, list) =>
      user.id &&
      list.findIndex((item) => item.id === user.id) === index
  );

  function projectName(task) {
    const project = projects.find(
      (item) => String(item.id) === String(task.project)
    );

    return (
      task.project_name ||
      task.project_title ||
      project?.name ||
      `Project #${task.project}`
    );
  }

  function assigneeName(task) {
    const user = availableUsers.find(
      (item) => String(item.id) === String(task.assigned_to)
    );

    return (
      task.assigned_to_name ||
      task.assignee_name ||
      user?.username ||
      user?.email ||
      "Unassigned"
    );
  }

  const filteredTasks = tasks.filter((task) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      task.title,
      task.description,
      projectName(task),
      assigneeName(task),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" ||
      task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const todoCount = tasks.filter(
    (task) => task.status === "todo"
  ).length;

  const progressCount = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  return (
    <div className="tasks-layout">
      <aside className="tasks-sidebar">
        <div className="tasks-brand">
          <div className="tasks-brand-icon">F</div>
          <div>
            <h2>FlowDesk</h2>
            <span>Project Workspace</span>
          </div>
        </div>

        <p className="tasks-nav-label">WORKSPACE</p>

        <nav className="tasks-nav">
          <button onClick={() => navigate("/dashboard")}>
            <span>▦</span> Dashboard
          </button>
          <button onClick={() => navigate("/projects")}>
            <span>▣</span> Projects
          </button>
          <button
            className="active"
            onClick={() => navigate("/tasks")}
          >
            <span>✓</span> Tasks
          </button>
          <button onClick={() => navigate("/team")}>
            <span>♧</span> Team
          </button>
          <button onClick={() => navigate("/notifications")}>
            <span>♢</span> Notifications
          </button>
          <button onClick={() => navigate("/reports")}>
            <span>▤</span> Reports
          </button>
        </nav>

        <div className="tasks-sidebar-bottom">
          <button onClick={() => navigate("/profile")}>
            <span>◉</span> My Profile
          </button>
          <button onClick={handleSignOut}>
            <span>↪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="tasks-main">
        <header className="tasks-topbar">
          <div>
            <span className="tasks-eyebrow">
              WORKSPACE / TASKS
            </span>
            <h1>Tasks</h1>
            <p>
              Organize assignments, monitor progress, and get work done.
            </p>
          </div>

          <button
            type="button"
            className="tasks-primary-button"
            onClick={() => {
              resetForm();
              document
                .getElementById("task-form")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            + New Task
          </button>
        </header>

        {error && (
          <div className="tasks-alert tasks-alert-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div
            className="tasks-alert tasks-alert-success"
            role="status"
          >
            {message}
          </div>
        )}

        <section className="tasks-stats">
          <article className="tasks-stat-card">
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
            <small>All assigned work</small>
          </article>
          <article className="tasks-stat-card">
            <span>To do</span>
            <strong>{todoCount}</strong>
            <small>Waiting to begin</small>
          </article>
          <article className="tasks-stat-card">
            <span>In progress</span>
            <strong>{progressCount}</strong>
            <small>Currently underway</small>
          </article>
          <article className="tasks-stat-card">
            <span>Completed</span>
            <strong>{completedCount}</strong>
            <small>Finished work</small>
          </article>
        </section>

        <section className="tasks-panel" id="task-form">
          <div className="tasks-panel-heading">
            <div>
              <h2>
                {editingId !== null ? "Edit task" : "Create a task"}
              </h2>
              <p>
                {editingId !== null
                  ? "Update the task details."
                  : "Add work and assign responsibility."}
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                className="tasks-text-button"
                onClick={resetForm}
              >
                Cancel editing
              </button>
            )}
          </div>

          <form className="tasks-form" onSubmit={handleSubmit}>
            <label>
              Task title *
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Design the login page"
                required
              />
            </label>

            <label>
              Project *
              <select
                name="project"
                value={form.project}
                onChange={handleChange}
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Assign to *
              <select
                name="assigned_to"
                value={form.assigned_to}
                onChange={handleChange}
                required
              >
                <option value="">Select a team member</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username || user.email || `User ${user.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label>
              Priority
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label>
              Due date
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
              />
            </label>

            <label className="tasks-description-field">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what needs to be done."
                rows={4}
              />
            </label>

            <div className="tasks-form-actions">
              <button
                type="submit"
                className="tasks-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Create Task"}
              </button>
            </div>
          </form>
        </section>

        <section className="tasks-panel">
          <div className="tasks-panel-heading">
            <div>
              <h2>All tasks</h2>
              <p>Find and manage work across your projects.</p>
            </div>
            <span className="tasks-count">
              {filteredTasks.length} tasks
            </span>
          </div>

          <div className="tasks-filters">
            <input
              type="search"
              placeholder="Search tasks..."
              aria-label="Search tasks"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
            >
              <option value="all">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <button
              type="button"
              className="tasks-secondary-button"
              onClick={loadTasks}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="tasks-empty-state">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="tasks-empty-state">
              <div className="tasks-empty-icon">✓</div>
              <h3>No tasks found</h3>
              <p>
                {tasks.length === 0
                  ? "Create your first task using the form above."
                  : "Try changing your search or filters."}
              </p>
            </div>
          ) : (
            <div className="tasks-table-wrapper">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Assigned to</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <div className="tasks-name-cell">
                          <span className="tasks-name-icon">
                            {(task.title || "T")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                          <div>
                            <strong>{task.title}</strong>
                            <small>
                              {task.description || "No description"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{projectName(task)}</td>
                      <td>{assigneeName(task)}</td>
                      <td>
                        <span
                          className={`tasks-status status-${task.status}`}
                        >
                          {(task.status || "unknown").replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`tasks-priority priority-${task.priority}`}
                        >
                          {task.priority || "Not set"}
                        </span>
                      </td>
                      <td>{formatDate(task.due_date)}</td>
                      <td>
                        <div className="tasks-row-actions">
                          <button
                            type="button"
                            onClick={() => handleEdit(task)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="delete"
                            onClick={() => handleDelete(task)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
