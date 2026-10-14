import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../Services/api";
import "./Team.css";

/* ========================================
   HELPER FUNCTIONS
======================================== */

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getName(person) {
  if (!person) return "Not provided";

  if (typeof person === "string") return person;

  if (typeof person === "number") {
    return `User #${person}`;
  }

  const fullName = [
    person.first_name,
    person.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    person.username ||
    person.name ||
    person.full_name ||
    (person.id ? `User #${person.id}` : "Not provided")
  );
}

function getInitials(person) {
  const name = getName(person);

  if (name === "Not provided") return "?";

  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function getRole(person) {
  return String(person?.role || "employee")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatus(value) {
  return String(value || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProjectManager(project) {
  return (
    project.manager_name ||
    project.manager_details ||
    project.manager ||
    project.manager_username ||
    null
  );
}

function getTaskAssignee(task) {
  return (
    task.assigned_to_details ||
    task.assigned_to ||
    task.assignee ||
    null
  );
}

function getTaskProject(task) {
  return (
    task.project_name ||
    task.project_details ||
    task.project ||
    null
  );
}

function getErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 401) {
    return "Your session may have expired. Please log in again.";
  }

  if (status === 403) {
    return "Your account does not have permission to access this information.";
  }

  if (!error?.response) {
    return "Could not connect to the server. Check that your Django backend is running.";
  }

  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    "We could not load this information. Please try again."
  );
}

function formatDate(value) {
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No due date";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getPriority(value) {
  return String(value || "Not specified")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/* ========================================
   TEAM PAGE
======================================== */

function Team() {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [profileError, setProfileError] = useState("");
  const [projectsError, setProjectsError] = useState("");
  const [tasksError, setTasksError] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");

  /* ========================================
     LOAD DATA
  ======================================== */

  const loadTeamData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [profileResult, projectsResult, tasksResult] =
        await Promise.allSettled([
          api.get("/profile/"),
          api.get("/projects/"),
          api.get("/tasks/"),
        ]);

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value.data);
        setProfileError("");
      } else {
        setProfile(null);
        setProfileError(
          getErrorMessage(profileResult.reason)
        );
        console.error(
          "Team profile request failed:",
          profileResult.reason
        );
      }

      if (projectsResult.status === "fulfilled") {
        setProjects(getList(projectsResult.value.data));
        setProjectsError("");
      } else {
        setProjects([]);
        setProjectsError(
          getErrorMessage(projectsResult.reason)
        );
        console.error(
          "Team projects request failed:",
          projectsResult.reason
        );
      }

      if (tasksResult.status === "fulfilled") {
        setTasks(getList(tasksResult.value.data));
        setTasksError("");
      } else {
        setTasks([]);
        setTasksError(
          getErrorMessage(tasksResult.reason)
        );
        console.error(
          "Team tasks request failed:",
          tasksResult.reason
        );
      }
    } catch (error) {
      console.error("Unexpected Team page error:", error);
    } finally {
      // Always remove the loading screen, even if a request fails.
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  /* ========================================
     SEARCH AND FILTER
  ======================================== */

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const name = String(
        project.name || project.title || ""
      ).toLowerCase();

      const description = String(
        project.description || ""
      ).toLowerCase();

      const manager = getName(
        getProjectManager(project)
      ).toLowerCase();

      return (
        !query ||
        name.includes(query) ||
        description.includes(query) ||
        manager.includes(query)
      );
    });
  }, [projects, search]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const title = String(
        task.title || task.name || ""
      ).toLowerCase();

      const description = String(
        task.description || ""
      ).toLowerCase();

      const status = String(
        task.status || ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        description.includes(query);

      const matchesFilter =
        taskFilter === "all" ||
        (taskFilter === "completed" &&
          status === "completed") ||
        (taskFilter === "in_progress" &&
          status === "in_progress") ||
        (taskFilter === "todo" &&
          status === "todo");

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, taskFilter]);

  /* ========================================
     STATISTICS
  ======================================== */

  const activeProjects = projects.filter(
    (project) =>
      String(project.status || "").toLowerCase() === "active"
  ).length;

  const completedTasks = tasks.filter(
    (task) =>
      String(task.status || "").toLowerCase() === "completed"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) =>
      String(task.status || "").toLowerCase() === "in_progress"
  ).length;

  /* ========================================
     LOADING SCREEN
  ======================================== */

  if (loading) {
    return (
      <main className="team-page">
        <div className="team-loading">
          <div className="team-spinner" />
          <p>Loading your workspace...</p>
        </div>
      </main>
    );
  }

  /* ========================================
     MAIN PAGE
  ======================================== */

  return (
    <main className="team-page">
      {/* PAGE HEADER */}

      <header className="team-header">
        <div>
          <p className="team-eyebrow">WORKSPACE</p>

          <h1>Team &amp; Collaboration</h1>

          <p className="team-subtitle">
            View your workspace profile, projects,
            managers, and task activity.
          </p>
        </div>

        <button
          type="button"
          className="team-refresh-button"
          onClick={() => loadTeamData(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh data"}
        </button>
      </header>

      {/* DIRECTORY ACCESS NOTICE */}

      <section
        className="team-access-notice"
        role="status"
      >
        <div className="team-notice-icon">i</div>

        <div>
          <h2>Team directory access is restricted</h2>

          <p>
            Your account cannot access the complete user
            directory. This page displays the profile,
            projects, and task information available to
            your account.
          </p>
        </div>
      </section>

      {/* ERROR MESSAGES */}

      {profileError && (
        <section className="team-error" role="alert">
          <h2>Profile unavailable</h2>
          <p>{profileError}</p>
        </section>
      )}

      {projectsError && (
        <section className="team-error" role="alert">
          <h2>Projects unavailable</h2>
          <p>{projectsError}</p>
        </section>
      )}

      {tasksError && (
        <section className="team-error" role="alert">
          <h2>Tasks unavailable</h2>
          <p>{tasksError}</p>
        </section>
      )}

      {/* WORKSPACE STATISTICS */}

      <section
        className="team-stats"
        aria-label="Workspace overview"
      >
        <article className="team-stat-card">
          <p className="team-stat-label">Your role</p>

          <h2 className="team-stat-value">
            {profile ? getRole(profile) : "—"}
          </h2>

          <p className="team-stat-description">
            Your current workspace role
          </p>
        </article>

        <article className="team-stat-card">
          <p className="team-stat-label">Total projects</p>

          <h2 className="team-stat-value">
            {projects.length}
          </h2>

          <p className="team-stat-description">
            {activeProjects} active projects
          </p>
        </article>

        <article className="team-stat-card">
          <p className="team-stat-label">Total tasks</p>

          <h2 className="team-stat-value">
            {tasks.length}
          </h2>

          <p className="team-stat-description">
            Tasks available in your workspace
          </p>
        </article>

        <article className="team-stat-card">
          <p className="team-stat-label">Completed tasks</p>

          <h2 className="team-stat-value">
            {completedTasks}
          </h2>

          <p className="team-stat-description">
            {inProgressTasks} currently in progress
          </p>
        </article>
      </section>

      {/* PROFILE */}

      <section className="team-profile-section">
        <div className="team-section-header">
          <div>
            <h2>Your workspace profile</h2>

            <p>
              Your account details and workspace role.
            </p>
          </div>
        </div>

        {profile ? (
          <article className="team-profile-card">
            {profile.profile_picture ? (
              <img
                className="team-profile-avatar"
                src={profile.profile_picture}
                alt={getName(profile)}
              />
            ) : (
              <div className="team-profile-avatar">
                {getInitials(profile)}
              </div>
            )}

            <div className="team-profile-details">
              <h3>{getName(profile)}</h3>

              <p>
                <strong>Username:</strong>{" "}
                {profile.username || "Not provided"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {profile.email || "Not provided"}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {profile.phone_number || "Not provided"}
              </p>

              <div className="team-profile-role">
                <span className="team-role-badge">
                  {getRole(profile)}
                </span>
              </div>
            </div>
          </article>
        ) : (
          <div className="team-profile-card">
            <p className="team-inline-message">
              Your profile could not be displayed.
              Check the error message above and refresh.
            </p>
          </div>
        )}
      </section>

      {/* PROJECTS */}

      <section className="team-directory-section">
        <div className="team-section-header">
          <div>
            <h2>Projects &amp; collaboration</h2>

            <p>
              Review projects, their status, priorities,
              and manager information.
            </p>
          </div>
        </div>

        <input
          type="search"
          className="team-search"
          placeholder="Search projects and tasks..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search projects and tasks"
        />

        {projectsError ? (
          <p className="team-inline-message">
            Project information is currently unavailable.
          </p>
        ) : filteredProjects.length === 0 ? (
          <p className="team-inline-message">
            {projects.length === 0
              ? "No projects are available to display."
              : "No projects match your search."}
          </p>
        ) : (
          <div className="team-project-grid">
            {filteredProjects.map((project) => {
              const manager = getProjectManager(project);

              return (
                <article
                  className="team-project-card"
                  key={project.id}
                >
                  <div className="team-project-top">
                    <div className="team-project-heading">
                      <div className="team-project-avatar">
                        {getInitials(
                          project.name || project.title || "Project"
                        )}
                      </div>

                      <div>
                        <h3>
                          {project.name ||
                            project.title ||
                            `Project #${project.id}`}
                        </h3>

                        <p className="team-project-manager">
                          <strong>Manager:</strong>{" "}
                          {getName(manager)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`team-role-badge project-status-${String(
                        project.status || "unknown"
                      ).toLowerCase()}`}
                    >
                      {getStatus(project.status)}
                    </span>
                  </div>

                  <p className="team-project-description">
                    {project.description ||
                      "No project description has been provided."}
                  </p>

                  <div className="team-project-meta">
                    <span>
                      <strong>Priority:</strong>{" "}
                      {getPriority(project.priority)}
                    </span>

                    <span>
                      <strong>Due date:</strong>{" "}
                      {formatDate(
                        project.end_date || project.due_date
                      )}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* TASK ACTIVITY */}

      <section className="team-directory-section">
        <div className="team-section-header">
          <div>
            <h2>Task activity</h2>

            <p>
              Review task assignments, deadlines, and progress.
            </p>
          </div>
        </div>

        <div
          className="team-task-filters"
          aria-label="Filter tasks by status"
        >
          <button
            type="button"
            className={taskFilter === "all" ? "active" : ""}
            onClick={() => setTaskFilter("all")}
          >
            All tasks
          </button>

          <button
            type="button"
            className={taskFilter === "todo" ? "active" : ""}
            onClick={() => setTaskFilter("todo")}
          >
            To do
          </button>

          <button
            type="button"
            className={
              taskFilter === "in_progress" ? "active" : ""
            }
            onClick={() => setTaskFilter("in_progress")}
          >
            In progress
          </button>

          <button
            type="button"
            className={
              taskFilter === "completed" ? "active" : ""
            }
            onClick={() => setTaskFilter("completed")}
          >
            Completed
          </button>
        </div>

        {tasksError ? (
          <p className="team-inline-message">
            Task information is currently unavailable.
          </p>
        ) : filteredTasks.length === 0 ? (
          <p className="team-inline-message">
            {tasks.length === 0
              ? "No tasks are available to display."
              : "No tasks match your current search or filter."}
          </p>
        ) : (
          <div className="team-task-list">
            {filteredTasks.map((task) => {
              const assignee = getTaskAssignee(task);
              const project = getTaskProject(task);

              return (
                <article
                  className="team-task-item"
                  key={task.id}
                >
                  <div className="team-task-main">
                    <h3>
                      {task.title ||
                        task.name ||
                        `Task #${task.id}`}
                    </h3>

                    <p>
                      {task.description ||
                        "No task description has been provided."}
                    </p>

                    <div className="team-task-meta">
                      <span>
                        <strong>Assigned to:</strong>{" "}
                        {getName(assignee)}
                      </span>

                      <span>
                        <strong>Project:</strong>{" "}
                        {getName(project)}
                      </span>

                      <span>
                        <strong>Due date:</strong>{" "}
                        {formatDate(
                          task.due_date || task.end_date
                        )}
                      </span>

                      <span>
                        <strong>Priority:</strong>{" "}
                        {getPriority(task.priority)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`team-role-badge project-status-${String(
                      task.status || "unknown"
                    ).toLowerCase()}`}
                  >
                    {getStatus(task.status)}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Team;
