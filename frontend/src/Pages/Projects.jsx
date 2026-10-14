import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Services/api";
import "./Projects.css";

const initialForm = {
  name: "",
  description: "",
  status: "planning",
  priority: "medium",
  start_date: "",
  due_date: "",
  manager: "",
};

export default function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadProjects() {
    setLoading(true);

    try {
      const response = await api.get("/projects/");
      const data = response.data;

      setProjects(
        Array.isArray(data) ? data : data.results || []
      );
      setError("");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else if (err.response?.status === 403) {
        setError(
          "Your account does not have permission to view projects."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load projects. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadManagers() {
    try {
      const response = await api.get("/users/");
      const data = response.data;
      const availableUsers = Array.isArray(data)
        ? data
        : data.results || [];

      setUsers(availableUsers);
    } catch (err) {
      // The users endpoint may have stricter permissions.
      // We can still use the logged-in user if their profile is available.
      console.warn("Could not load the user list:", err);
    }
  }

  async function loadProfile() {
    try {
      const response = await api.get("/profile/");
      const profile = response.data;

      setCurrentUser(profile);

      if (profile?.id) {
        setForm((previous) => ({
          ...previous,
          manager: previous.manager || String(profile.id),
        }));
      }
    } catch (err) {
      console.warn("Could not load your profile:", err);
    }
  }

  useEffect(() => {
    loadProjects();
    loadManagers();
    loadProfile();
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
      manager: currentUser?.id ? String(currentUser.id) : "",
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
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      manager: form.manager ? Number(form.manager) : null,
    };

    try {
      if (editingId !== null) {
        await api.patch(`/projects/${editingId}/`, payload);
        setMessage("Project updated successfully.");
      } else {
        await api.post("/projects/", payload);
        setMessage("Project created successfully.");
      }

      setForm({
        ...initialForm,
        manager: currentUser?.id ? String(currentUser.id) : "",
      });

      setEditingId(null);
      await loadProjects();
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        const details = Object.entries(data)
          .map(([field, value]) => {
            const description = Array.isArray(value)
              ? value.join(", ")
              : typeof value === "string"
                ? value
                : JSON.stringify(value);

            return `${field}: ${description}`;
          })
          .join(" | ");

        setError(
          details || "Unable to save the project. Please try again."
        );
      } else {
        setError(
          "Unable to save the project. Please check your connection."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(project) {
    setEditingId(project.id);

    setForm({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "planning",
      priority: project.priority || "medium",
      start_date: project.start_date || "",
      due_date: project.due_date || "",
      manager: project.manager
        ? String(project.manager)
        : currentUser?.id
          ? String(currentUser.id)
          : "",
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(project) {
    const confirmed = window.confirm(
      `Delete "${project.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/projects/${project.id}/`);

      setProjects((previous) =>
        previous.filter((item) => item.id !== project.id)
      );

      setMessage("Project deleted successfully.");

      if (editingId === project.id) {
        resetForm();
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete this project. Check your account permissions."
      );
    }
  }

  function handleSignOut() {
    localStorage.removeItem("flowdesk_access_token");
    localStorage.removeItem("flowdesk_refresh_token");
    navigate("/login");
  }

  const managerOptions = [
    ...users,
    ...(currentUser?.id &&
    !users.some((user) => user.id === currentUser.id)
      ? [currentUser]
      : []),
  ].filter(
    (user, index, array) =>
      user.id &&
      array.findIndex((item) => item.id === user.id) === index
  );

  const filteredProjects = projects.filter((project) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      project.name,
      project.description,
      project.manager_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = projects.filter(
    (project) => project.status === "active"
  ).length;

  const planningCount = projects.filter(
    (project) => project.status === "planning"
  ).length;

  const completedCount = projects.filter(
    (project) => project.status === "completed"
  ).length;

  function formatDate(value) {
    if (!value) return "—";

    return value.split("T")[0];
  }

  return (
    <div className="projects-layout">
      <aside className="projects-sidebar">
        <div className="projects-brand">
          <div className="projects-brand-icon">F</div>

          <div>
            <h2>FlowDesk</h2>
            <span>Project Workspace</span>
          </div>
        </div>

        <p className="projects-nav-label">WORKSPACE</p>

        <nav className="projects-nav">
          <button onClick={() => navigate("/dashboard")}>
            <span>▦</span> Dashboard
          </button>

          <button
            className="active"
            onClick={() => navigate("/projects")}
          >
            <span>▣</span> Projects
          </button>

          <button onClick={() => navigate("/tasks")}>
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

        <div className="projects-sidebar-bottom">
          <button onClick={() => navigate("/profile")}>
            <span>◉</span> My Profile
          </button>

          <button onClick={handleSignOut}>
            <span>↪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="projects-main">
        <header className="projects-topbar">
          <div>
            <span className="projects-eyebrow">
              WORKSPACE / PROJECTS
            </span>

            <h1>Projects</h1>

            <p>
              Plan work, manage responsibilities, and track delivery.
            </p>
          </div>

          <button
            type="button"
            className="projects-primary-button"
            onClick={() => {
              resetForm();
              document
                .getElementById("project-form")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            + New Project
          </button>
        </header>

        {error && (
          <div className="projects-alert projects-alert-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div
            className="projects-alert projects-alert-success"
            role="status"
          >
            {message}
          </div>
        )}

        <section className="projects-stats">
          <article className="projects-stat-card">
            <span>Total projects</span>
            <strong>{projects.length}</strong>
            <small>Projects in your workspace</small>
          </article>

          <article className="projects-stat-card">
            <span>Active</span>
            <strong>{activeCount}</strong>
            <small>Currently in progress</small>
          </article>

          <article className="projects-stat-card">
            <span>Planning</span>
            <strong>{planningCount}</strong>
            <small>Preparing to start</small>
          </article>

          <article className="projects-stat-card">
            <span>Completed</span>
            <strong>{completedCount}</strong>
            <small>Finished projects</small>
          </article>
        </section>

        <section className="projects-panel" id="project-form">
          <div className="projects-panel-heading">
            <div>
              <h2>
                {editingId !== null
                  ? "Edit project"
                  : "Create a project"}
              </h2>

              <p>
                {editingId !== null
                  ? "Update the project details below."
                  : "Set up a project for your team."}
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                className="projects-text-button"
                onClick={resetForm}
              >
                Cancel editing
              </button>
            )}
          </div>

          <form className="projects-form" onSubmit={handleSubmit}>
            <label>
              Project name *
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Website Redesign"
                required
              />
            </label>

            <label>
              Project manager *
              <select
                name="manager"
                value={form.manager}
                onChange={handleChange}
                required
              >
                <option value="">Select a manager</option>

                {managerOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username || user.email || `User ${user.id}`}
                    {user.role ? ` (${user.role})` : ""}
                  </option>
                ))}
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
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label>
              Start date
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </label>

            <label>
              Due date *
              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                required
              />
            </label>

            <label className="projects-description-field">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the project goals and expected outcome."
                rows={4}
              />
            </label>

            <div className="projects-form-actions">
              <button
                type="submit"
                className="projects-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Create Project"}
              </button>
            </div>
          </form>
        </section>

        <section className="projects-panel">
          <div className="projects-panel-heading projects-list-heading">
            <div>
              <h2>All projects</h2>
              <p>Search, filter, and manage your projects.</p>
            </div>

            <span className="projects-count">
              {filteredProjects.length} projects
            </span>
          </div>

          <div className="projects-filters">
            <input
              type="search"
              placeholder="Search projects..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search projects"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            <button
              type="button"
              className="projects-secondary-button"
              onClick={loadProjects}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="projects-empty-state">
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="projects-empty-state">
              <div className="projects-empty-icon">▣</div>
              <h3>No projects found</h3>
              <p>
                {projects.length === 0
                  ? "Create your first project using the form above."
                  : "Try another search or status filter."}
              </p>
            </div>
          ) : (
            <div className="projects-table-wrapper">
              <table className="projects-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Start date</th>
                    <th>Due date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <div className="projects-name-cell">
                          <span className="projects-name-icon">
                            {(project.name || "P")
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <div>
                            <strong>{project.name}</strong>
                            <small>
                              {project.description ||
                                "No description added"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {project.manager_name ||
                          managerOptions.find(
                            (user) => user.id === project.manager
                          )?.username ||
                          "—"}
                      </td>

                      <td>
                        <span
                          className={`projects-status status-${project.status}`}
                        >
                          {(project.status || "unknown").replace(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`projects-priority priority-${project.priority}`}
                        >
                          {project.priority || "Not set"}
                        </span>
                      </td>

                      <td>{formatDate(project.start_date)}</td>
                      <td>{formatDate(project.due_date)}</td>

                      <td>
                        <div className="projects-row-actions">
                          <button
                            type="button"
                            onClick={() => handleEdit(project)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() => handleDelete(project)}
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